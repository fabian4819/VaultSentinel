# CRE Workflow — Vault Sentinel Risk Monitor

## Overview

This CRE workflow monitors ETH market conditions every 60 seconds and writes a risk score on-chain to the `VaultSentinel` contract. If the score exceeds 70/100, the contract automatically returns all user funds.

## Workflow Steps

| Step | Type | Purpose |
|---|---|---|
| `fetch_eth_price` | chainlink-data-feed | Read ETH/USD from Chainlink mainnet oracle |
| `fetch_tvl` | http | Fetch Lido TVL from DeFiLlama API |
| `compute_risk_score` | javascript | Weighted risk formula (price 60% + TVL 40%) |
| `write_risk_score` | eth-transaction | Call `setRiskScore(uint256)` on VaultSentinel |
| `log_result` | javascript | Debug logging |

## Risk Score Formula

```
priceScore = clamp((BASELINE - ethPrice) / BASELINE * 100 * 2, 0, 100)
tvlScore   = clamp((TVL_BASELINE - tvl)  / TVL_BASELINE * 100 * 2, 0, 100)
riskScore  = round(priceScore * 0.6 + tvlScore * 0.4)
```

Threshold: **70/100** → triggers `emergencyWithdrawAll()`

## Files

- `vault-sentinel-workflow.yaml` — workflow definition
- `.env.yaml` — non-secret env vars (RPC URL, contract address)
- `.secrets.yaml` — private key (gitignored, never commit)

## Running

### Simulate (no live txns)
```bash
cd cre
cre simulate vault-sentinel-workflow.yaml --env .env.yaml --secrets .secrets.yaml
```

### Deploy to CRE network
```bash
cre deploy vault-sentinel-workflow.yaml --env .env.yaml --secrets .secrets.yaml
```

## Contract Addresses (Tenderly VNet — chain 9991)

- **VaultSentinel:** `0x261a123cB069E154e34e8047acF665CfB4880835`
- **MockERC20:** `0x87BaB170C4292c965bfeCAD0014D073a404c369E`
