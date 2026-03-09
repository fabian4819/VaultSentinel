# 🛡️ GuardAI

> **Autonomous DeFi vault that auto-withdraws your funds when systemic risk is detected via Chainlink CRE.**

---

## What is GuardAI?

GuardAI is an autonomous DeFi risk protection system. It monitors systemic risk across major DeFi protocols in real time and **automatically withdraws user funds** before a crisis hits — with zero manual intervention.

No alerts. No waiting. No human trigger required.

---

## The Problem

DeFi users are exposed to systemic risk events:

- 📉 ETH price crashes
- 🔓 Lido, Aave, or MakerDAO TVL drains
- 💥 Protocol exploits and contagion events

By the time users react manually, it's too late. GuardAI eliminates that reaction-time gap.

---

## How It Works

```
Chainlink CRE Workflow (every 60s)
        │
        ├─ Chainlink Data Feed → ETH/USD price
        ├─ DeFiLlama HTTP API  → Lido / Aave / MakerDAO TVL
        │
        └─ Compute Systemic Risk Index (weighted score 0–100)
                │
                └─ Write score on-chain → VaultSentinel.setRiskScore()
                        │
                        ├─ Score < 70  → Vault stays ACTIVE ✅
                        └─ Score ≥ 70  → EMERGENCY triggered 🚨
                                │
                                └─ All user ETH + ERC20 returned instantly
```

---

## Key Features

| Feature | Description |
|---|---|
| **Live Risk Gauge** | Real-time score pulled from the smart contract |
| **Auto Emergency Withdrawal** | Funds returned to users when score ≥ 70 |
| **Multi-asset Support** | ETH, USDC, stETH (ERC20 whitelisting) |
| **Circuit Breaker** | New deposits blocked when vault is in EMERGENCY |
| **Chainlink CRE Powered** | Fully automated, no centralized oracle dependency |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity 0.8.24, Hardhat, OpenZeppelin |
| Automation | Chainlink CRE (Compute Runtime Environment) |
| Data | Chainlink Data Feeds (ETH/USD), DeFiLlama API |
| Frontend | Next.js 14, Tailwind CSS, Framer Motion, wagmi v2 |
| Testnet | Tenderly Virtual Testnet (mainnet fork, ChainID 9991) |

---

## Repository

[github.com/fabian4819/VaultSentinel](https://github.com/fabian4819/VaultSentinel)
