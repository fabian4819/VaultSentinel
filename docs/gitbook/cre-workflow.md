# Chainlink CRE Workflow

**File:** `cre/vault-sentinel-workflow.yaml`  
**Trigger:** Cron — every 60 seconds  
**Purpose:** Compute Systemic Risk Index and write it on-chain

---

## Overview

The CRE (Compute Runtime Environment) workflow is the autonomous engine of GuardAI. It runs every minute, aggregates risk signals from multiple sources, computes a weighted score, and writes it to `VaultSentinel.setRiskScore()` on-chain.

If the score reaches **70 or above**, the smart contract automatically triggers an emergency withdrawal — no human action needed.

---

## Workflow Steps

```
Step 1: fetch_eth_price    → Chainlink Data Feed (ETH/USD)
Step 2: fetch_lido_tvl     → DeFiLlama HTTP API
Step 3: fetch_aave_tvl     → DeFiLlama HTTP API
Step 4: fetch_maker_tvl    → DeFiLlama HTTP API
Step 5: compute_systemic_risk → JavaScript (weighted score)
Step 6: write_risk_score   → eth-transaction (setRiskScore)
Step 7: log_result         → JavaScript (console debug)
```

---

## Step 1 — ETH/USD from Chainlink Data Feed

```yaml
- id: fetch_eth_price
  type: chainlink-data-feed
  params:
    feedAddress: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"  # ETH/USD Mainnet
  output: eth_price
```

Uses the official Chainlink ETH/USD aggregator on Ethereum mainnet.  
Returns: `{ answer, decimals, updatedAt }` — price is `answer / 10^decimals`.

---

## Steps 2–4 — Protocol TVL from DeFiLlama

```yaml
- id: fetch_lido_tvl
  type: http
  params:
    method: GET
    url: "https://api.llama.fi/protocol/lido"
  output: lido_response

- id: fetch_aave_tvl
  type: http
  params:
    method: GET
    url: "https://api.llama.fi/protocol/aave"
  output: aave_response

- id: fetch_maker_tvl
  type: http
  params:
    method: GET
    url: "https://api.llama.fi/protocol/makerdao"
  output: maker_response
```

Each response exposes `currentChainTvls.Ethereum` — the current TVL locked on Ethereum mainnet.

---

## Step 5 — Compute Systemic Risk Index

The core of GuardAI's risk model. Runs in a JavaScript compute step:

### Risk Factors & Weights

| Factor | Weight | Baseline | Score Formula |
|---|---|---|---|
| ETH Price Drop | **30%** | $3,500 | `min(100, priceDrop% × 2.5)` |
| Lido TVL Drain | **25%** | $10B | `min(100, drain% × 2)` |
| Aave TVL Drain | **25%** | $8B | `min(100, drain% × 2)` |
| MakerDAO TVL Drain | **20%** | $6B | `min(100, drain% × 2)` |

### Final Score

$$\text{RiskScore} = (\text{priceScore} \times 0.30) + (\text{lidoScore} \times 0.25) + (\text{aaveScore} \times 0.25) + (\text{makerScore} \times 0.20)$$

Score is always an integer from **0 to 100**.

### Example Output
```json
{
  "riskScore": 45,
  "breakdown": {
    "ethPrice": 2800.00,
    "priceScore": 50,
    "lidoTvlB": "9.20",
    "lidoScore": 16,
    "aaveTvlB": "7.80",
    "aaveScore": 5,
    "makerTvlB": "5.90",
    "makerScore": 3
  }
}
```

---

## Step 6 — Write Score On-Chain

```yaml
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
```

Calls `VaultSentinel.setRiskScore()` with the computed score.  
The contract handles the rest — including emergency withdrawal if threshold is breached.

---

## Environment Variables

| Variable | Description |
|---|---|
| `env.TENDERLY_RPC_URL` | RPC endpoint for the target network |
| `env.VAULT_SENTINEL_ADDRESS` | Deployed VaultSentinel contract address |
| `secrets.CRE_WALLET_PRIVATE_KEY` | Private key of the authorized CRE wallet |

> ⚠️ The CRE wallet address must match `authorizedCaller` set in the contract. Update with `setAuthorizedCaller()` if changed.

---

## Console Log Output (Step 7)

When running, the workflow logs a detailed breakdown:

```
[VaultSentinel] ═══ SYSTEMIC RISK INDEX ═══
  SCORE       : 82/100 ⚠️  EMERGENCY!
  ETH Price   : $2100.00 → priceScore:  85
  Lido TVL    : $7.20B  → lidoScore:   56
  Aave TVL    : $6.10B  → aaveScore:   47
  MakerDAO    : $5.00B  → makerScore:  33
  Weights     : ETH 30% | Lido 25% | Aave 25% | Maker 20%
════════════════════════════════════════
  🚨 THRESHOLD BREACHED — VaultSentinel emergency triggered!
  All user ETH + ERC20 assets returned automatically.
```

---

## Simulating the Workflow Locally

Since CRE workflows require a live CRE node, use the Hardhat script to simulate `setRiskScore()` directly:

```bash
# Simulate a high-risk attack (score = 82)
SCORE=82 npx hardhat run scripts/simulate-attack.ts --network tenderly

# Restore a safe score (score = 20)
SCORE=20 npx hardhat run scripts/simulate-attack.ts --network tenderly
```

See [Scripts Reference](scripts.md) for full details.
