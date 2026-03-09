# Scripts Reference

All scripts are run with Hardhat against the `tenderly` network:

```bash
npx hardhat run scripts/<script>.ts --network tenderly
```

---

## `deploy.ts`

Deploys all contracts and saves addresses to `deployment.json`.

```bash
npx hardhat run scripts/deploy.ts --network tenderly
```

**What it does:**
1. Deploys `MockERC20` as USDC (6 decimals) and stETH (18 decimals)
2. Mints 1,000,000 USDC + 100 stETH to deployer
3. Deploys `VaultSentinel` with `authorizedCaller = deployer`, `riskThreshold = 70`
4. Whitelists both tokens in the vault
5. Writes `deployment.json` with all contract addresses

**Output file — `deployment.json`:**
```json
{
  "vaultSentinel": "0x...",
  "mockUSDC": "0x...",
  "mockStETH": "0x...",
  "network": "tenderly-mainnet-fork",
  "chainId": 9991,
  "deployer": "0x..."
}
```

---

## `simulate-attack.ts`

Injects an arbitrary risk score directly into the vault. Simulates what the Chainlink CRE workflow does on-chain.

```bash
SCORE=82 npx hardhat run scripts/simulate-attack.ts --network tenderly
```

**Environment variable:**
- `SCORE` — integer 0–100. Required.

**What it does:**
- Calls `VaultSentinel.setRiskScore(SCORE)`
- If `SCORE >= 70`: vault enters EMERGENCY, all funds returned
- If `SCORE < 70`: vault stays ACTIVE (or resets score if already active)

**Example — trigger emergency:**
```bash
SCORE=82 npx hardhat run scripts/simulate-attack.ts --network tenderly
# → Vault flips to EMERGENCY, all deposits returned
```

**Example — restore safe score:**
```bash
SCORE=20 npx hardhat run scripts/simulate-attack.ts --network tenderly
# → Sets lastRiskScore to 20 (vault must be reset first)
```

---

## `reset-vault.ts`

Resets the vault from `EMERGENCY` back to `ACTIVE`.

```bash
npx hardhat run scripts/reset-vault.ts --network tenderly
```

**What it does:**
- Calls `VaultSentinel.resetVault()` (owner only)
- Sets `vaultState = ACTIVE`
- Does **not** return funds — that already happened during emergency

> ⚠️ Must be run as the contract owner (deployer wallet).

**Typical usage before demo:**
```bash
# 1. Reset vault
npx hardhat run scripts/reset-vault.ts --network tenderly

# 2. Set safe score
SCORE=20 npx hardhat run scripts/simulate-attack.ts --network tenderly

# 3. Now deposits work again
```

---

## `faucet-tenderly.ts`

Funds the deployer wallet with 100 ETH on the Tenderly Virtual Testnet.

```bash
npx hardhat run scripts/faucet-tenderly.ts --network tenderly
```

**What it does:**
- Calls `tenderly_setBalance` via JSON-RPC
- Sets deployer balance to `0x56BC75E2D63100000` (100 ETH in hex)

> Only works on Tenderly Virtual Testnets. Not applicable on mainnet or public testnets.

---

## Script Dependency on `deployment.json`

All scripts read contract addresses from `deployment.json` at runtime:

```typescript
const deployment = JSON.parse(fs.readFileSync("deployment.json", "utf8"));
const vault = await ethers.getContractAt("VaultSentinel", deployment.vaultSentinel);
```

Always re-run `deploy.ts` if you switch to a new Tenderly Virtual Testnet — old addresses will be invalid.

---

## Quick Reference

| Script | Command | When to Use |
|---|---|---|
| `deploy.ts` | `npx hardhat run scripts/deploy.ts --network tenderly` | New testnet / first setup |
| `faucet-tenderly.ts` | `npx hardhat run scripts/faucet-tenderly.ts --network tenderly` | Wallet is empty |
| `simulate-attack.ts` | `SCORE=82 npx hardhat run scripts/simulate-attack.ts --network tenderly` | Trigger EMERGENCY for demo |
| `reset-vault.ts` | `npx hardhat run scripts/reset-vault.ts --network tenderly` | After EMERGENCY, restore ACTIVE |
