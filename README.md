# Vault Sentinel — AI-Assisted DeFi Risk Protection

An automated, AI-assisted risk protection system designed for the **Chainlink Convergence Hackathon**.

Vault Sentinel monitors market conditions (ETH price deviation + TVL drain) using Chainlink CRE and automatically triggers on-chain protective actions (fund return) when the risk score exceeds a configurable threshold.

## 🏆 Hackathon Tracks
- **Risk & Compliance:** Automated risk monitoring, real-time protocol safeguard triggers.
- **Tenderly Virtual TestNets:** Deployed on a Tenderly Virtual TestNet with real-time mainnet state sync.

## Project Architecture

1. **Smart Contracts (`contracts/VaultSentinel.sol`)**
   - Holds user deposits in native ETH.
   - Exposes `setRiskScore()` callable only by designated CRE workflow.
   - If risk score > 70, transitions to `EMERGENCY` state and automatically refunds ETH to depositors' wallets.
2. **Chainlink CRE Workflow (`cre/vault-sentinel-workflow.yaml`)**
   - Runs every 60s.
   - Fetches ETH/USD from Chainlink Data Feeds (Mainnet).
   - Fetches Lido TVL via HTTP API (DeFiLlama).
   - Computes weighted risk score (60% price, 40% TVL).
   - Writes risk score on-chain to `VaultSentinel` on Tenderly.
3. **Next.js Frontend (`frontend/`)**
   - Real-time risk gauge mirroring the on-chain value.
   - Wallet connection & user deposit component.
   - Action panel to simulate emergencies or reset the vault.

## Running Locally

1. **Clone the Repo**
   ```bash
   git clone <repo-url>
   cd chainlink-cre
   npm install
   ```

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:3000`. Connect MetaMask (configure with the Tenderly RPC URL provided in `.env`).

3. **Simulate CRE Workflow**
   ```bash
   cd cre
   cre simulate vault-sentinel-workflow.yaml --env .env.yaml --secrets .secrets.yaml
   ```

4. **Simulate Attack**
   ```bash
   npx hardhat run scripts/simulate-attack.ts --network tenderly
   ```

## Contract Addresses

*Deployed on Tenderly Virtual TestNet (Mainnet Fork, Chain ID 9991)*

- **VaultSentinel:** `0x84bF3a495d0431c034462B09797698Bc1f78E824`
