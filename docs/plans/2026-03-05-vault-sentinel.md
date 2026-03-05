# Vault Sentinel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a POC DeFi risk protection vault that uses a Chainlink CRE Workflow to monitor ETH price + TVL, compute a risk score, write it on-chain, and automatically return user funds when the score exceeds a threshold.

**Architecture:** A `VaultSentinel.sol` Solidity contract deployed on a Tenderly Virtual TestNet holds user deposits and exposes `setRiskScore()` + `triggerEmergency()` callable only by an authorized CRE workflow address. A Chainlink CRE Workflow (YAML) fetches the ETH/USD Data Feed and DeFiLlama TVL HTTP endpoint every 60s, computes a weighted risk score in an inline JS step, writes it on-chain, and triggers emergency fund return when score > 70. A minimal Next.js frontend shows vault state, risk score, deposit form, manual emergency action, and a demo simulation button.

**Tech Stack:** Solidity 0.8.x, Hardhat, ethers.js, Chainlink CRE CLI, Tenderly Virtual TestNets, Next.js 14 (App Router), wagmi + viem, Tailwind CSS, DeFiLlama API

---

## Project Structure

```
chainlink-cre/
├── contracts/
│   ├── VaultSentinel.sol
│   ├── MockERC20.sol
│   └── test/
│       ├── VaultSentinel.test.ts
│       └── MockERC20.test.ts
├── scripts/
│   ├── deploy.ts
│   └── simulate-attack.ts
├── cre/
│   └── vault-sentinel-workflow.yaml
├── frontend/
│   ├── app/
│   │   ├── page.tsx            ← single page
│   │   ├── layout.tsx
│   │   └── components/
│   │       ├── VaultStatus.tsx
│   │       ├── RiskGauge.tsx
│   │       ├── DepositForm.tsx
│   │       ├── ActionPanel.tsx  ← emergency withdraw + manual trigger
│   │       ├── WorkflowLog.tsx
│   │       └── SimulateButton.tsx
│   ├── lib/
│   │   ├── contract.ts         ← contract address + ABI
│   │   └── wagmi.ts
│   └── package.json
├── hardhat.config.ts
├── package.json
└── docs/plans/
    └── 2026-03-05-vault-sentinel.md
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `hardhat.config.ts`
- Create: `.env.example`
- Create: `tsconfig.json`

**Step 1: Initialize the project**

```bash
cd /Users/fabian/Code/web3/chainlink-cre
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox typescript ts-node @types/node dotenv
npx hardhat init
# Select: "Create a TypeScript project", accept all defaults
```

Expected: `hardhat.config.ts`, `contracts/`, `test/`, `scripts/` scaffold created.

**Step 2: Configure Hardhat for Tenderly**

Replace `hardhat.config.ts` with:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    tenderly: {
      url: process.env.TENDERLY_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: Number(process.env.TENDERLY_CHAIN_ID || "1"),
    },
  },
};

export default config;
```

**Step 3: Create `.env.example`**

```bash
cat > .env.example << 'EOF'
TENDERLY_RPC_URL=https://virtual.mainnet.rpc.tenderly.co/YOUR_VNET_ID
TENDERLY_CHAIN_ID=1
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
VAULT_SENTINEL_ADDRESS=
CRE_AUTHORIZED_ADDRESS=
EOF
```

**Step 4: Set up Tenderly Virtual TestNet**

1. Go to https://dashboard.tenderly.co → Virtual TestNets → Create
2. Fork: Ethereum Mainnet, set unlimited faucet
3. Copy the RPC URL into `.env` as `TENDERLY_RPC_URL`
4. Fund your wallet via Tenderly faucet

**Step 5: Commit**

```bash
git init
git add .
git commit -m "chore: project scaffold with Hardhat + Tenderly config"
```

---

## Task 2: MockERC20 Token Contract

**Files:**
- Create: `contracts/MockERC20.sol`
- Create: `contracts/test/MockERC20.test.ts`

**Step 1: Write the failing test**

```typescript
// contracts/test/MockERC20.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MockERC20", function () {
  it("should mint tokens to deployer", async function () {
    const [owner, user] = await ethers.getSigners();
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy("Mock USD", "mUSD", 18);
    await token.waitForDeployment();

    await token.mint(user.address, ethers.parseEther("1000"));
    expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("1000"));
  });
});
```

**Step 2: Run to verify it fails**

```bash
npx hardhat test contracts/test/MockERC20.test.ts
```

Expected: FAIL — "MockERC20 not found"

**Step 3: Implement MockERC20**

```solidity
// contracts/MockERC20.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    uint8 private _decimals;

    constructor(string memory name, string memory symbol, uint8 decimals_)
        ERC20(name, symbol)
    {
        _decimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

Install OpenZeppelin:
```bash
npm install @openzeppelin/contracts
```

**Step 4: Run test to verify it passes**

```bash
npx hardhat test contracts/test/MockERC20.test.ts
```

Expected: PASS — 1 passing

**Step 5: Commit**

```bash
git add contracts/MockERC20.sol contracts/test/MockERC20.test.ts
git commit -m "feat: add MockERC20 token for vault deposits"
```

---

## Task 3: VaultSentinel Smart Contract

**Files:**
- Create: `contracts/VaultSentinel.sol`
- Create: `contracts/test/VaultSentinel.test.ts`

**Step 1: Write the failing tests**

```typescript
// contracts/test/VaultSentinel.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { VaultSentinel, MockERC20 } from "../typechain-types";

describe("VaultSentinel", function () {
  let vault: VaultSentinel;
  let token: MockERC20;
  let owner: any, user: any, cre: any;

  beforeEach(async function () {
    [owner, user, cre] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("Mock USD", "mUSD", 18);
    await token.waitForDeployment();

    const VaultSentinel = await ethers.getContractFactory("VaultSentinel");
    vault = await VaultSentinel.deploy(
      await token.getAddress(),
      cre.address,   // authorized CRE caller
      70             // risk threshold (0-100)
    );
    await vault.waitForDeployment();

    // Fund user and approve vault
    await token.mint(user.address, ethers.parseEther("100"));
    await token.connect(user).approve(await vault.getAddress(), ethers.parseEther("100"));
  });

  it("should accept user deposit", async function () {
    await vault.connect(user).deposit(ethers.parseEther("100"));
    expect(await vault.getUserBalance(user.address)).to.equal(ethers.parseEther("100"));
  });

  it("should allow CRE to write risk score", async function () {
    await vault.connect(cre).setRiskScore(42);
    expect(await vault.lastRiskScore()).to.equal(42);
  });

  it("should reject non-CRE risk score write", async function () {
    await expect(vault.connect(user).setRiskScore(42)).to.be.revertedWith("Unauthorized");
  });

  it("should trigger emergency and return funds to user", async function () {
    await vault.connect(user).deposit(ethers.parseEther("100"));
    const balanceBefore = await token.balanceOf(user.address);

    await vault.connect(cre).triggerEmergency();

    expect(await vault.vaultState()).to.equal(2); // EMERGENCY = 2
    expect(await token.balanceOf(user.address)).to.equal(
      balanceBefore + ethers.parseEther("100")
    );
  });

  it("should block deposits in EMERGENCY state", async function () {
    await vault.connect(cre).triggerEmergency();
    await expect(
      vault.connect(user).deposit(ethers.parseEther("10"))
    ).to.be.revertedWith("Vault is in emergency");
  });

  it("should allow owner to reset vault to ACTIVE", async function () {
    await vault.connect(cre).triggerEmergency();
    await vault.connect(owner).resetVault();
    expect(await vault.vaultState()).to.equal(0); // ACTIVE = 0
  });
});
```

**Step 2: Run to verify they fail**

```bash
npx hardhat test contracts/test/VaultSentinel.test.ts
```

Expected: FAIL — "VaultSentinel not found"

**Step 3: Implement VaultSentinel**

```solidity
// contracts/VaultSentinel.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VaultSentinel is Ownable {
    enum VaultState { ACTIVE, GUARDED, EMERGENCY }

    IERC20 public immutable token;
    address public authorizedCaller;    // CRE workflow address
    uint256 public riskThreshold;       // score 0-100 that triggers emergency
    VaultState public vaultState;
    uint256 public lastRiskScore;

    mapping(address => uint256) private _balances;
    address[] private _depositors;      // track who deposited for mass return

    event RiskScoreUpdated(uint256 score, uint256 timestamp);
    event EmergencyTriggered(uint256 riskScore, uint256 timestamp);
    event FundsReturned(address indexed user, uint256 amount);
    event Deposited(address indexed user, uint256 amount);

    modifier onlyAuthorized() {
        require(msg.sender == authorizedCaller || msg.sender == owner(), "Unauthorized");
        _;
    }

    modifier notEmergency() {
        require(vaultState != VaultState.EMERGENCY, "Vault is in emergency");
        _;
    }

    constructor(address token_, address authorizedCaller_, uint256 riskThreshold_)
        Ownable(msg.sender)
    {
        token = IERC20(token_);
        authorizedCaller = authorizedCaller_;
        riskThreshold = riskThreshold_;
        vaultState = VaultState.ACTIVE;
    }

    function deposit(uint256 amount) external notEmergency {
        require(amount > 0, "Amount must be > 0");
        token.transferFrom(msg.sender, address(this), amount);
        if (_balances[msg.sender] == 0) {
            _depositors.push(msg.sender);
        }
        _balances[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    function setRiskScore(uint256 score) external onlyAuthorized {
        require(score <= 100, "Score must be 0-100");
        lastRiskScore = score;
        emit RiskScoreUpdated(score, block.timestamp);
        if (score >= riskThreshold) {
            _executeEmergency(score);
        }
    }

    function triggerEmergency() external onlyAuthorized {
        _executeEmergency(lastRiskScore);
    }

    function _executeEmergency(uint256 score) internal {
        if (vaultState == VaultState.EMERGENCY) return; // idempotent
        vaultState = VaultState.EMERGENCY;
        emit EmergencyTriggered(score, block.timestamp);
        _returnAllFunds();
    }

    function _returnAllFunds() internal {
        for (uint256 i = 0; i < _depositors.length; i++) {
            address user = _depositors[i];
            uint256 bal = _balances[user];
            if (bal > 0) {
                _balances[user] = 0;
                token.transfer(user, bal);
                emit FundsReturned(user, bal);
            }
        }
    }

    function getUserBalance(address user) external view returns (uint256) {
        return _balances[user];
    }

    function resetVault() external onlyOwner {
        vaultState = VaultState.ACTIVE;
    }

    function setAuthorizedCaller(address caller) external onlyOwner {
        authorizedCaller = caller;
    }

    function setRiskThreshold(uint256 threshold) external onlyOwner {
        require(threshold <= 100, "Threshold must be 0-100");
        riskThreshold = threshold;
    }
}
```

**Step 4: Run tests to verify they pass**

```bash
npx hardhat test contracts/test/VaultSentinel.test.ts
```

Expected: PASS — 6 passing

**Step 5: Commit**

```bash
git add contracts/VaultSentinel.sol contracts/test/VaultSentinel.test.ts
git commit -m "feat: VaultSentinel contract with state machine and emergency fund return"
```

---

## Task 4: Deploy to Tenderly Virtual TestNet

**Files:**
- Create: `scripts/deploy.ts`

**Step 1: Write deploy script**

```typescript
// scripts/deploy.ts
import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1. Deploy MockERC20
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const token = await MockERC20.deploy("Mock USD", "mUSD", 18);
  await token.waitForDeployment();
  console.log("MockERC20 deployed to:", await token.getAddress());

  // 2. Mint tokens to deployer for testing
  await token.mint(deployer.address, ethers.parseEther("10000"));
  console.log("Minted 10,000 mUSD to deployer");

  // 3. Deploy VaultSentinel
  // authorizedCaller: initially the deployer (will be updated after CRE setup)
  const VaultSentinel = await ethers.getContractFactory("VaultSentinel");
  const vault = await VaultSentinel.deploy(
    await token.getAddress(),
    deployer.address,  // placeholder — will setAuthorizedCaller after CRE deploy
    70                 // risk threshold: score >= 70 triggers emergency
  );
  await vault.waitForDeployment();
  console.log("VaultSentinel deployed to:", await vault.getAddress());

  // 4. Save addresses to file for frontend and CRE workflow
  const addresses = {
    mockERC20: await token.getAddress(),
    vaultSentinel: await vault.getAddress(),
    network: "tenderly",
    deployer: deployer.address,
  };
  fs.writeFileSync("deployment.json", JSON.stringify(addresses, null, 2));
  console.log("Addresses saved to deployment.json");
}

main().catch((e) => { console.error(e); process.exit(1); });
```

**Step 2: Deploy**

```bash
npx hardhat run scripts/deploy.ts --network tenderly
```

Expected output:
```
Deploying with: 0x...
MockERC20 deployed to: 0x...
Minted 10,000 mUSD to deployer
VaultSentinel deployed to: 0x...
Addresses saved to deployment.json
```

**Step 3: Verify on Tenderly Explorer**

Copy the VaultSentinel address from `deployment.json` and verify it on your Tenderly Virtual TestNet explorer dashboard. Check the Transactions tab — deployment tx should appear.

**Step 4: Commit**

```bash
git add scripts/deploy.ts deployment.json
git commit -m "feat: deploy scripts + deployment.json for Tenderly VNet"
```

---

## Task 5: CRE Workflow (The Star)

**Files:**
- Create: `cre/vault-sentinel-workflow.yaml`
- Create: `cre/README.md`

**Step 1: Install CRE CLI**

```bash
# Install Chainlink CRE CLI
npm install -g @chainlink/cre-cli
# OR follow: https://docs.chain.link/chainlink-runtime-environment
cre --version
```

Expected: CRE CLI version printed.

**Step 2: Write the workflow YAML**

```yaml
# cre/vault-sentinel-workflow.yaml
name: vault-sentinel-risk-monitor
description: "Monitors ETH price + TVL and triggers emergency protection if risk score > 70"

trigger:
  type: cron
  schedule: "*/60 * * * * *"   # every 60 seconds

steps:
  # Step 1: Fetch ETH/USD price from Chainlink Data Feed
  - id: fetch_eth_price
    type: chainlink-data-feed
    params:
      feedAddress: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"  # ETH/USD mainnet
    output: eth_price   # returns { answer: <price in 1e8>, decimals: 8 }

  # Step 2: Fetch TVL from DeFiLlama
  - id: fetch_tvl
    type: http
    params:
      method: GET
      url: "https://api.llama.fi/protocol/lido"
      headers:
        Accept: "application/json"
    output: tvl_response   # returns DeFiLlama protocol object

  # Step 3: Compute risk score in JavaScript
  - id: compute_risk_score
    type: javascript
    inputs:
      ethPrice: "{{fetch_eth_price.answer}}"
      decimals: "{{fetch_eth_price.decimals}}"
      tvlCurrent: "{{tvl_response.currentChainTvls.Ethereum}}"
    code: |
      // Normalize price (Chainlink returns 1e8)
      const price = Number(ethPrice) / Math.pow(10, Number(decimals));
      const BASELINE_PRICE = 3500;  // set your baseline USD price

      // Price deviation score: % drop from baseline, capped at 100
      const priceDelta = Math.max(0, (BASELINE_PRICE - price) / BASELINE_PRICE * 100);
      const priceScore = Math.min(100, priceDelta * 2);  // amplify for sensitivity

      // TVL drop score: if tvl data unavailable, score = 0
      const tvl = Number(tvlCurrent || 0);
      const TVL_BASELINE = 10_000_000_000;  // $10B baseline for Lido
      const tvlDrop = Math.max(0, (TVL_BASELINE - tvl) / TVL_BASELINE * 100);
      const tvlScore = Math.min(100, tvlDrop * 2);

      // Weighted risk score
      const riskScore = Math.round((priceScore * 0.6) + (tvlScore * 0.4));

      return {
        riskScore,
        priceScore: Math.round(priceScore),
        tvlScore: Math.round(tvlScore),
        ethPrice: price,
        tvlUsd: tvl,
      };
    output: risk_result

  # Step 4: ALWAYS write risk score on-chain (for UI to read)
  - id: write_risk_score
    type: eth-transaction
    params:
      rpcUrl: "{{env.TENDERLY_RPC_URL}}"
      contractAddress: "{{env.VAULT_SENTINEL_ADDRESS}}"
      abi:
        - "function setRiskScore(uint256 score) external"
      function: setRiskScore
      args:
        - "{{risk_result.riskScore}}"
      privateKey: "{{secrets.CRE_WALLET_PRIVATE_KEY}}"
    # Note: setRiskScore internally checks if score >= threshold and calls _executeEmergency

  # Step 5: Log result (optional, for debugging)
  - id: log_result
    type: javascript
    inputs:
      result: "{{risk_result}}"
    code: |
      console.log(`[VaultSentinel] Risk score: ${result.riskScore}/100`);
      console.log(`  ETH price: $${result.ethPrice} | priceScore: ${result.priceScore}`);
      console.log(`  TVL: $${result.tvlUsd} | tvlScore: ${result.tvlScore}`);
      return result;
```

**Step 3: Create CRE secrets file (DO NOT COMMIT)**

```bash
cat > cre/.secrets.yaml << 'EOF'
CRE_WALLET_PRIVATE_KEY: "0xYOUR_CRE_WALLET_PRIVATE_KEY"
EOF
echo "cre/.secrets.yaml" >> .gitignore
```

**Step 4: Create CRE env file**

```bash
cat > cre/.env.yaml << 'EOF'
TENDERLY_RPC_URL: "https://virtual.mainnet.rpc.tenderly.co/YOUR_VNET_ID"
VAULT_SENTINEL_ADDRESS: "0xYOUR_DEPLOYED_VAULT_ADDRESS"
EOF
```

**Step 5: Simulate the workflow via CLI**

```bash
cd cre
cre simulate vault-sentinel-workflow.yaml --env .env.yaml --secrets .secrets.yaml
```

Expected: All 5 steps run, risk score computed and written on-chain. Check Tenderly explorer for the `setRiskScore` transaction.

**Step 6: Deploy workflow to CRE network**

```bash
cre deploy vault-sentinel-workflow.yaml --env .env.yaml --secrets .secrets.yaml
```

Expected: Workflow deployed, workflow ID returned.

**Step 7: Update authorized caller in contract**

After CRE deployment, get the CRE workflow's signing address and update the contract:

```bash
# In scripts/update-authorized-caller.ts
npx hardhat run scripts/update-authorized-caller.ts --network tenderly
```

*(Create this script to call `vault.setAuthorizedCaller(CRE_WALLET_ADDRESS)`)*

**Step 8: Commit**

```bash
git add cre/vault-sentinel-workflow.yaml cre/README.md cre/.env.yaml
git commit -m "feat: CRE workflow for risk monitoring + on-chain score writing"
```

---

## Task 6: Simulate Attack Script

**Files:**
- Create: `scripts/simulate-attack.ts`

**Purpose:** Inject a high risk score to trigger emergency during demo without waiting for natural price movements.

**Step 1: Write the script**

```typescript
// scripts/simulate-attack.ts
import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();
  const deployment = require("../deployment.json");

  const vault = await ethers.getContractAt(
    "VaultSentinel",
    deployment.vaultSentinel,
    owner
  );

  const score = process.env.SCORE ? Number(process.env.SCORE) : 95;
  console.log(`🔴 Simulating attack: setting risk score to ${score}`);

  const tx = await vault.setRiskScore(score);
  await tx.wait();

  const state = await vault.vaultState();
  const stateNames = ["ACTIVE", "GUARDED", "EMERGENCY"];
  console.log(`✅ Risk score set to ${score}`);
  console.log(`🏛️  Vault state: ${stateNames[Number(state)]}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

**Step 2: Run and verify**

```bash
SCORE=95 npx hardhat run scripts/simulate-attack.ts --network tenderly
```

Expected:
```
🔴 Simulating attack: setting risk score to 95
✅ Risk score set to 95
🏛️  Vault state: EMERGENCY
```

Verify on Tenderly Explorer: check the transaction and confirm `EmergencyTriggered` event emitted.

**Step 3: Commit**

```bash
git add scripts/simulate-attack.ts
git commit -m "feat: simulate-attack script for demo mode"
```

---

## Task 7: Frontend — Single Page App

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/app/page.tsx`
- Create: `frontend/app/layout.tsx`
- Create: `frontend/lib/contract.ts`
- Create: `frontend/app/components/VaultStatus.tsx`
- Create: `frontend/app/components/RiskGauge.tsx`
- Create: `frontend/app/components/DepositForm.tsx`
- Create: `frontend/app/components/ActionPanel.tsx`
- Create: `frontend/app/components/WorkflowLog.tsx`

**Step 1: Scaffold frontend**

```bash
cd /Users/fabian/Code/web3/chainlink-cre
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd frontend
npm install wagmi viem @tanstack/react-query
```

**Step 2: Create contract lib**

```typescript
// frontend/lib/contract.ts
import { parseAbi } from "viem";
import deployment from "../../deployment.json";

export const VAULT_ADDRESS = deployment.vaultSentinel as `0x${string}`;
export const TOKEN_ADDRESS = deployment.mockERC20 as `0x${string}`;

export const VAULT_ABI = parseAbi([
  "function deposit(uint256 amount) external",
  "function getUserBalance(address user) external view returns (uint256)",
  "function lastRiskScore() external view returns (uint256)",
  "function vaultState() external view returns (uint8)",
  "function riskThreshold() external view returns (uint256)",
  "function triggerEmergency() external",
  "function resetVault() external",
  "event RiskScoreUpdated(uint256 score, uint256 timestamp)",
  "event EmergencyTriggered(uint256 riskScore, uint256 timestamp)",
  "event FundsReturned(address indexed user, uint256 amount)",
]);

export const TOKEN_ABI = parseAbi([
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function mint(address to, uint256 amount) external",
]);

export const VAULT_STATES = ["🟢 ACTIVE", "🟡 GUARDED", "🔴 EMERGENCY"] as const;
```

**Step 3: Set up wagmi providers in layout**

```typescript
// frontend/app/layout.tsx
"use client";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defineChain } from "viem";

const tenderlyVNet = defineChain({
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID || "1"),
  name: "Tenderly Virtual TestNet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_TENDERLY_RPC_URL || ""] },
  },
});

const config = createConfig({
  chains: [tenderlyVNet],
  transports: { [tenderlyVNet.id]: http() },
});

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
```

**Step 4: Build RiskGauge component**

```typescript
// frontend/app/components/RiskGauge.tsx
export function RiskGauge({ score }: { score: number }) {
  const color = score < 40 ? "bg-green-500" : score < 70 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-gray-400 mb-1">
        <span>Risk Score</span>
        <span className="font-bold text-white">{score} / 100</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-4">
        <div
          className={`h-4 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Safe</span>
        <span>Threshold: 70</span>
        <span>Danger</span>
      </div>
    </div>
  );
}
```

**Step 5: Build DepositForm component**

```typescript
// frontend/app/components/DepositForm.tsx
"use client";
import { useState } from "react";
import { useWriteContract, useReadContract, useAccount } from "wagmi";
import { parseEther } from "viem";
import { VAULT_ADDRESS, VAULT_ABI, TOKEN_ADDRESS, TOKEN_ABI } from "@/lib/contract";

export function DepositForm() {
  const [amount, setAmount] = useState("100");
  const { address } = useAccount();
  const { writeContract: approve, isPending: isApproving } = useWriteContract();
  const { writeContract: deposit, isPending: isDepositing } = useWriteContract();

  const { data: balance } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "getUserBalance",
    args: [address!],
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  async function handleDeposit() {
    const amt = parseEther(amount);
    // First approve token spend
    approve({
      address: TOKEN_ADDRESS,
      abi: TOKEN_ABI,
      functionName: "approve",
      args: [VAULT_ADDRESS, amt],
    });
    // Then deposit (user will confirm two txns)
    setTimeout(() => {
      deposit({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "deposit",
        args: [amt],
      });
    }, 3000);
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4 space-y-3">
      <h3 className="text-white font-semibold">Deposit Funds</h3>
      <p className="text-gray-400 text-sm">
        Your vault balance: {balance ? (Number(balance) / 1e18).toFixed(2) : "0"} mUSD
      </p>
      <div className="flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
          placeholder="Amount (mUSD)"
        />
        <button
          onClick={handleDeposit}
          disabled={isApproving || isDepositing}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {isApproving ? "Approving..." : isDepositing ? "Depositing..." : "Deposit"}
        </button>
      </div>
    </div>
  );
}
```

**Step 6: Build ActionPanel component**

```typescript
// frontend/app/components/ActionPanel.tsx
"use client";
import { useWriteContract } from "wagmi";
import { VAULT_ADDRESS, VAULT_ABI } from "@/lib/contract";

export function ActionPanel({ vaultState }: { vaultState: number }) {
  const { writeContract, isPending } = useWriteContract();

  function handleManualEmergency() {
    writeContract({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: "triggerEmergency",
    });
  }

  function handleResetVault() {
    writeContract({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: "resetVault",
    });
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4 space-y-3">
      <h3 className="text-white font-semibold">Manual Actions</h3>
      <div className="flex gap-2">
        <button
          onClick={handleManualEmergency}
          disabled={isPending || vaultState === 2}
          className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          🚨 Trigger Emergency
        </button>
        <button
          onClick={handleResetVault}
          disabled={isPending || vaultState !== 2}
          className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          ♻️ Reset Vault
        </button>
      </div>
      <p className="text-gray-500 text-xs">
        Emergency returns all user funds automatically. Reset re-opens the vault.
      </p>
    </div>
  );
}
```

**Step 7: Build main page**

```typescript
// frontend/app/page.tsx
"use client";
import { useReadContract, useConnect, useAccount, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { VAULT_ADDRESS, VAULT_ABI, VAULT_STATES } from "@/lib/contract";
import { RiskGauge } from "./components/RiskGauge";
import { DepositForm } from "./components/DepositForm";
import { ActionPanel } from "./components/ActionPanel";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const { data: vaultState } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "vaultState",
    query: { refetchInterval: 3000 },
  });

  const { data: riskScore } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "lastRiskScore",
    query: { refetchInterval: 5000 },
  });

  const stateIndex = Number(vaultState ?? 0);
  const score = Number(riskScore ?? 0);

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">🛡️ Vault Sentinel</h1>
        {isConnected ? (
          <button onClick={() => disconnect()} className="text-xs text-gray-400 hover:text-white">
            {address?.slice(0, 6)}...{address?.slice(-4)} ✕
          </button>
        ) : (
          <button
            onClick={() => connect({ connector: injected() })}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Connect Wallet
          </button>
        )}
      </div>

      {/* Vault State Banner */}
      <div className={`rounded-xl p-4 mb-4 text-center font-bold text-lg
        ${stateIndex === 0 ? "bg-green-900/50 border border-green-700" :
          stateIndex === 1 ? "bg-yellow-900/50 border border-yellow-700" :
          "bg-red-900/50 border border-red-700"}`}>
        Vault Status: {VAULT_STATES[stateIndex]}
        {stateIndex === 2 && (
          <p className="text-sm font-normal text-red-300 mt-1">
            Funds have been automatically returned to all depositors.
          </p>
        )}
      </div>

      {/* Risk Gauge */}
      <div className="bg-gray-800 rounded-xl p-4 mb-4">
        <RiskGauge score={score} />
        <p className="text-xs text-gray-500 mt-2">
          CRE Workflow updates every 60s • Threshold: 70/100
        </p>
      </div>

      {/* Deposit Form */}
      {isConnected && (
        <div className="mb-4">
          <DepositForm />
        </div>
      )}

      {/* Action Panel */}
      {isConnected && (
        <div className="mb-4">
          <ActionPanel vaultState={stateIndex} />
        </div>
      )}

      {/* Info Footer */}
      <div className="text-center text-xs text-gray-600 mt-8">
        <p>Contract: {VAULT_ADDRESS.slice(0, 10)}...{VAULT_ADDRESS.slice(-6)}</p>
        <p>Network: Tenderly Virtual TestNet (Ethereum Mainnet Fork)</p>
      </div>
    </main>
  );
}
```

**Step 8: Create `.env.local` for frontend**

```bash
cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_TENDERLY_RPC_URL=https://virtual.mainnet.rpc.tenderly.co/YOUR_VNET_ID
NEXT_PUBLIC_CHAIN_ID=1
EOF
```

**Step 9: Run the frontend**

```bash
cd frontend
npm run dev
```

Open http://localhost:3000. Expected: Single dark-theme page with vault status, risk gauge, deposit form, and action buttons.

**Step 10: Commit**

```bash
git add frontend/
git commit -m "feat: minimal Next.js frontend with deposit, actions, and risk gauge"
```

---

## Task 8: E2E Demo Flow + Video

**Step 1: Full demo rehearsal script**

Run through this exact flow for the submission video:

```
1. Open browser at localhost:3000
2. Connect MetaMask (set network to Tenderly VNet)
3. Show: vault ACTIVE, risk score ~30-50
4. Deposit 100 mUSD into vault
5. Show: balance updated in vault
6. Open Tenderly Explorer — show CRE workflow running
7. Click "Trigger Emergency" in ActionPanel (or wait for CRE workflow to breach threshold)
8. Show: vault transitions to EMERGENCY state (red banner)
9. Show: mUSD balance returned to wallet in MetaMask
10. Open Tenderly Explorer — show EmergencyTriggered event on-chain
11. Optional: Click "Reset Vault" to show vault returns to ACTIVE
```

**Step 2: For demo simulation (if CRE score is naturally low)**

```bash
# Inject high risk score to trigger emergency during demo
SCORE=95 npx hardhat run scripts/simulate-attack.ts --network tenderly
```

**Step 3: Record 3–5 min video**

Required items to show:
- [ ] CRE Workflow YAML source code
- [ ] `cre simulate` output OR Tenderly Explorer showing CRE workflow transactions
- [ ] Vault contract state on Tenderly Explorer
- [ ] Frontend showing state transition from ACTIVE → EMERGENCY
- [ ] Funds returned to user wallet

**Step 4: Verify submission checklist**

```
[ ] VaultSentinel.sol deployed on Tenderly Virtual TestNet
[ ] Tenderly Explorer link shows contract + transactions
[ ] CRE Workflow deployed to CRE network OR cre simulate run clean  
[ ] GitHub repo is public
[ ] README.md lists all Chainlink files:
      - contracts/VaultSentinel.sol (setRiskScore reads from CRE)
      - cre/vault-sentinel-workflow.yaml (Chainlink Data Feed + eth-transaction)
[ ] 3-5 min video is publicly accessible (YouTube/Loom)
[ ] Submitted to Risk & Compliance track
[ ] Submitted to Tenderly Virtual TestNets sponsor track
```

**Step 5: Final commit**

```bash
git add README.md
git commit -m "docs: submission README with Chainlink file references"
git push origin main
```

---

## Verification Plan

### Automated Tests

```bash
# Run all contract tests
npx hardhat test

# Expected output:
#   MockERC20: 1 passing
#   VaultSentinel: 6 passing
```

### CRE Workflow Simulation

```bash
cd cre
cre simulate vault-sentinel-workflow.yaml --env .env.yaml --secrets .secrets.yaml

# Expected: All steps complete, risk score computed, setRiskScore tx submitted to Tenderly
```

### Manual E2E Test

1. Fund wallet via Tenderly faucet: https://dashboard.tenderly.co → Virtual TestNets → Faucet
2. `cd frontend && npm run dev`
3. Connect MetaMask to Tenderly VNet (add custom RPC with your VNet URL)
4. Deposit 100 mUSD via UI
5. Run `SCORE=95 npx hardhat run scripts/simulate-attack.ts --network tenderly`
6. Observe: Vault state changes to EMERGENCY in UI within 5s (polling interval)
7. Observe: mUSD returned to wallet (check MetaMask balance)
8. Verify on Tenderly Explorer: `EmergencyTriggered` + `FundsReturned` events visible
