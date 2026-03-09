# Getting Started

## Prerequisites

- **Node.js** v18+
- **npm** v9+
- **MetaMask** browser extension
- A **Tenderly** account ([tenderly.co](https://tenderly.co)) for Virtual Testnet

---

## 1. Clone & Install

```bash
git clone https://github.com/fabian4819/VaultSentinel.git
cd VaultSentinel

# Install root dependencies (Hardhat, scripts)
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

---

## 2. Configure Environment

### Root `.env` (Hardhat scripts)

Create `.env` in the project root:

```bash
TENDERLY_RPC_URL=https://virtual.mainnet.eu.rpc.tenderly.co/<your-vnet-id>
PRIVATE_KEY=0x<your-deployer-private-key>
```

### Frontend `frontend/.env.local` (Next.js)

```bash
NEXT_PUBLIC_TENDERLY_RPC_URL=https://virtual.mainnet.eu.rpc.tenderly.co/<your-vnet-id>
NEXT_PUBLIC_CHAIN_ID=9991
```

> ⚠️ Both files must point to the **same** Tenderly Virtual Testnet RPC. Mismatch will cause transactions to fail silently.

---

## 3. Create a Tenderly Virtual Testnet

1. Go to [dashboard.tenderly.co](https://dashboard.tenderly.co)
2. Navigate to **Virtual TestNets** → **Create Virtual TestNet**
3. Select **Ethereum Mainnet** as the base network
4. Copy the RPC URL and paste into both `.env` files above
5. Set Chain ID to `9991` in MetaMask

---

## 4. Fund Your Wallet

New Tenderly testnets start empty. Run the faucet script:

```bash
npx hardhat run scripts/faucet-tenderly.ts --network tenderly
```

This sets your deployer wallet balance to **100 ETH** using `tenderly_setBalance`.

---

## 5. Deploy Contracts

```bash
npx hardhat run scripts/deploy.ts --network tenderly
```

This will:
1. Deploy `MockUSDC` and `MockStETH` ERC20 tokens
2. Mint 1,000,000 USDC and 100 stETH to the deployer
3. Deploy `VaultSentinel` with threshold `70`
4. Whitelist USDC and stETH in the vault
5. Save all addresses to `deployment.json`

**Expected output:**
```
Deploying with: 0xdfcDBf41Eb7150592F6495F921891bc5e11A94d2
Balance: 100.0 ETH
MockUSDC deployed to: 0x87BaB170...
MockstETH deployed to: 0x009a5d46...
VaultSentinel deployed to: 0x0fD8E63a...
Whitelisting tokens...
Whitelist complete.
✅ Addresses saved to deployment.json
```

---

## 6. Add Tenderly Network to MetaMask

| Field | Value |
|---|---|
| Network Name | Tenderly Mainnet Fork |
| RPC URL | `https://virtual.mainnet.eu.rpc.tenderly.co/<your-vnet-id>` |
| Chain ID | `9991` |
| Currency Symbol | `ETH` |

---

## 7. Run the Frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Connect MetaMask to the Tenderly network. The app reads contract addresses automatically from `deployment.json` via `frontend/lib/contract.ts`.

---

## 8. Test the Full Flow

```bash
# 1. Simulate an attack (score = 82 → triggers EMERGENCY)
SCORE=82 npx hardhat run scripts/simulate-attack.ts --network tenderly

# 2. Reset vault back to ACTIVE
npx hardhat run scripts/reset-vault.ts --network tenderly

# 3. Restore safe score
SCORE=20 npx hardhat run scripts/simulate-attack.ts --network tenderly
```

See [Scripts Reference](scripts.md) for all available scripts.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Deposit transaction dropped | Ensure `frontend/.env.local` RPC matches root `.env` |
| Vault stuck in EMERGENCY | Run `scripts/reset-vault.ts` |
| 0.0 ETH on deployer wallet | Run `scripts/faucet-tenderly.ts` |
| MetaMask shows wrong network | Re-add Tenderly network with correct Chain ID `9991` |
| Contract not found | Re-run `deploy.ts` — `deployment.json` may point to old addresses |
