# Architecture

## Overview

GuardAI consists of three layers that work together autonomously:

```
┌─────────────────────────────────────────────────────────┐
│                    CHAINLINK CRE LAYER                  │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ ETH/USD Feed │  │ Lido TVL API │  │ Aave/Maker   │  │
│  │  (Chainlink) │  │  (DeFiLlama) │  │  TVL APIs    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         └─────────────────┼──────────────────┘          │
│                           ▼                             │
│              ┌────────────────────────┐                 │
│              │  JavaScript Compute    │                 │
│              │  Systemic Risk Index   │                 │
│              │  (weighted 0–100)      │                 │
│              └────────────┬───────────┘                 │
└───────────────────────────┼─────────────────────────────┘
                            │  setRiskScore() every 60s
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  SMART CONTRACT LAYER                   │
│                                                         │
│              ┌────────────────────────┐                 │
│              │    VaultSentinel.sol   │                 │
│              │                        │                 │
│              │  vaultState: ACTIVE    │                 │
│              │  riskThreshold: 70     │                 │
│              │  lastRiskScore: 0–100  │                 │
│              └────────────┬───────────┘                 │
│              score ≥ 70   │                             │
│              ─────────────▼                             │
│              ┌────────────────────────┐                 │
│              │  _executeEmergency()   │                 │
│              │  → _returnAllFunds()   │                 │
│              │  → vaultState=EMERGENCY│                 │
│              └────────────────────────┘                 │
└─────────────────────────────────────────────────────────┘
                            │
                            │  wagmi / viem reads
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                       │
│                                                         │
│   Home Tab        Pools Tab          Portfolio Tab      │
│   ──────────      ──────────────     ───────────────    │
│   Risk Gauge      ETH / USDC /       User deposits      │
│   Vault State     stETH pools        + balances         │
│   Features        Deposit form                          │
└─────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Normal Operation (score < 70)

1. CRE workflow triggers every **60 seconds**
2. Fetches ETH/USD from Chainlink Data Feed
3. Fetches Lido, Aave, MakerDAO TVL from DeFiLlama
4. Computes weighted **Systemic Risk Index**
5. Calls `VaultSentinel.setRiskScore(score)`
6. Vault remains `ACTIVE` — users can deposit/withdraw freely

### Emergency Triggered (score ≥ 70)

1. `setRiskScore(score)` receives score ≥ 70
2. Contract calls `_executeEmergency()` internally
3. `vaultState` flips to `EMERGENCY`
4. `_returnAllFunds()` iterates all depositors:
   - Returns ETH via low-level `call{value}`
   - Returns each whitelisted ERC20 via `IERC20.transfer()`
5. New deposits are **blocked** (`notEmergency` modifier)
6. Frontend polls contract state and reflects `EMERGENCY` banner

---

## Risk Score Formula

$$\text{RiskScore} = (\text{priceScore} \times 0.30) + (\text{lidoScore} \times 0.25) + (\text{aaveScore} \times 0.25) + (\text{makerScore} \times 0.20)$$

| Factor | Weight | Baseline | Metric |
|---|---|---|---|
| ETH Price Drop | 30% | $3,500 | % drop from baseline × 2.5 |
| Lido TVL Drain | 25% | $10B | % drain from baseline × 2 |
| Aave TVL Drain | 25% | $8B | % drain from baseline × 2 |
| MakerDAO TVL Drain | 20% | $6B | % drain from baseline × 2 |

All factor scores are capped at 100. Final score is 0–100.

---

## Contract State Machine

```
         deposit / withdraw
              ┌───┐
              │   │
         ┌────▼───┴────┐
         │   ACTIVE    │ ◄─── resetVault() (owner only)
         └──────┬──────┘
                │ setRiskScore(score ≥ 70)
                ▼
         ┌─────────────┐
         │  EMERGENCY  │  (all funds returned, deposits blocked)
         └─────────────┘
```

> **Note:** `GUARDED` state exists in the enum but is reserved for future use. The contract currently transitions directly `ACTIVE → EMERGENCY`.

---

## Deployed Addresses (Tenderly Virtual Testnet)

| Contract | Address |
|---|---|
| VaultSentinel | `0x0fD8E63a78b53B7b470763832521ddc20DA80e6f` |
| Mock USDC | `0x87BaB170C4292c965bfeCAD0014D073a404c369E` |
| Mock stETH | `0x009a5d466d1cefC40484a4f9c7334f605E5B26e7` |

**Network:** Tenderly Virtual Testnet (mainnet fork)  
**Chain ID:** `9991`  
**RPC:** `https://virtual.mainnet.eu.rpc.tenderly.co/a0f307c2-5f8b-4bdd-94ec-9736d1bceeb6`
