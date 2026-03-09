# Frontend

**Framework:** Next.js 14 (App Router)  
**Styling:** Tailwind CSS, Framer Motion  
**Blockchain:** wagmi v2, viem  
**Location:** `frontend/`

---

## Running Locally

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Connect MetaMask to the Tenderly Virtual Testnet (Chain ID `9991`).

---

## Environment

`frontend/.env.local`:
```bash
NEXT_PUBLIC_TENDERLY_RPC_URL=https://virtual.mainnet.eu.rpc.tenderly.co/<your-vnet-id>
NEXT_PUBLIC_CHAIN_ID=9991
```

> After changing `.env.local`, restart `npm run dev`.

---

## Pages & Navigation

The app is a single page (`app/page.tsx`) with three tabs:

| Tab | Description |
|---|---|
| **Home** | Live Risk Gauge, vault state banner, protocol features overview |
| **Pools** | Three asset pools (ETH, USDC, stETH) with APY and risk data. Opens deposit modal. |
| **Portfolio** | User's active deposits and balances across all assets |

---

## Key Components

### `Navbar.tsx`
Top navigation. Shows connected wallet address with disconnect button.  
Wallet connected state: emerald border, pulse dot, address in monospace.

### `Hero.tsx`
Homepage hero section with tagline and key stats.

### `RiskGauge.tsx`
Reads `lastRiskScore` and `vaultState` from the contract via `useReadContract`.  
Renders a live animated gauge with color bands:
- `0–40` → Green (Low Risk)
- `40–70` → Yellow (Moderate)
- `70+` → Red (Critical)

### `VaultStateBanner.tsx`
Displays a full-width banner when `vaultState == EMERGENCY`:
> 🚨 Vault is in EMERGENCY — all funds have been returned

### `PoolsGrid.tsx`
Grid of three pool cards. Each card shows:
- Asset name, APY, risk level
- TVL and utilization
- "Deposit" button → opens `PoolDetailModal`

### `PoolDetailModal.tsx`
Modal with two tabs: **Deposit** and **Withdraw**.  
Contains `DepositForm` for the selected asset.

### `DepositForm.tsx`
Handles the full deposit flow:

**ETH deposit (single step):**
```
Enter amount → Confirm in MetaMask → Wait receipt → ✅ Confirmed
```

**ERC20 deposit (two steps):**
```
Enter amount → Approve ERC20 → Wait approve receipt → Deposit → Wait receipt → ✅ Confirmed
```

Step indicator shows current progress (Step 1 / Step 2) for ERC20 tokens.  
Uses `useWaitForTransactionReceipt` to gate the deposit call on confirmed approval — prevents nonce conflicts.

### `Portfolio.tsx`
Reads user balances from the contract via `getUserBalance()`.  
Shows each asset with current balance and estimated USD value.

### `ActionPanel.tsx`
Owner-only panel for manual emergency trigger and vault reset (visible when connected as deployer).

---

## Contract Integration — `lib/contract.ts`

Reads `deployment.json` dynamically at build time:

```typescript
import deployment from "../../deployment.json";

export const VAULT_ADDRESS = deployment.vaultSentinel as `0x${string}`;
export const USDC_ADDRESS  = deployment.mockUSDC as `0x${string}`;
export const STETH_ADDRESS = deployment.mockStETH as `0x${string}`;
```

No hardcoded addresses — redeploy and the frontend picks up new addresses automatically.

---

## wagmi Configuration

The app uses a custom wagmi chain definition matching the Tenderly Virtual Testnet:

```typescript
const tenderlyChain = {
  id: 9991,
  name: "Tenderly Mainnet Fork",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_TENDERLY_RPC_URL!] }
  }
}
```

---

## Transaction Flow (ERC20 Deposit)

```
User clicks "Deposit"
        │
        ▼
writeContract(approve, [vaultAddress, amount])
        │
        ▼
setApproveTxHash(hash)
        │
        ▼
useWaitForTransactionReceipt(approveTxHash)
        │  approveConfirmed = true
        ▼
writeContract(depositERC20, [tokenAddress, amount])
        │
        ▼
setDepositTxHash(hash)
        │
        ▼
useWaitForTransactionReceipt(depositTxHash)
        │  depositSuccess = true
        ▼
Show "✅ Deposit Confirmed!"
```
