# Smart Contract — VaultSentinel

**File:** `contracts/VaultSentinel.sol`  
**Solidity:** `^0.8.24`  
**Inherits:** `Ownable` (OpenZeppelin)

---

## Overview

`VaultSentinel` is a multi-asset vault with a built-in circuit breaker. It holds user deposits (ETH + whitelisted ERC20 tokens) and automatically returns all funds when the risk score crosses a configurable threshold.

---

## State Variables

| Variable | Type | Description |
|---|---|---|
| `authorizedCaller` | `address` | Address allowed to call `setRiskScore()` — the CRE workflow wallet |
| `riskThreshold` | `uint256` | Score (0–100) that triggers emergency. Default: `70` |
| `vaultState` | `VaultState` | Current state: `ACTIVE`, `GUARDED`, or `EMERGENCY` |
| `lastRiskScore` | `uint256` | Last score written by the CRE workflow |
| `isSupportedToken` | `mapping(address → bool)` | Whitelisted ERC20 tokens |
| `supportedTokensList` | `address[]` | Array of all whitelisted tokens |
| `_balances` | `mapping(user → mapping(token → uint256))` | Per-user per-token balances. `address(0)` = ETH |
| `_depositors` | `address[]` | List of all unique depositors |

---

## Enum: VaultState

```solidity
enum VaultState { ACTIVE, GUARDED, EMERGENCY }
```

| State | Behavior |
|---|---|
| `ACTIVE` | Normal operation. Deposits and withdrawals allowed. |
| `GUARDED` | Reserved for future use. |
| `EMERGENCY` | All funds returned. New deposits blocked. Irreversible until owner calls `resetVault()`. |

---

## Modifiers

### `onlyAuthorized`
```solidity
modifier onlyAuthorized()
```
Allows only `authorizedCaller` (CRE wallet) or the contract `owner`.

### `notEmergency`
```solidity
modifier notEmergency()
```
Reverts with `"Vault is in emergency"` if `vaultState == EMERGENCY`. Applied to all deposit functions.

---

## Functions

### `depositETH()`
```solidity
function depositETH() external payable notEmergency
```
Accepts native ETH. Requires `msg.value > 0`. Records balance under `address(0)`.

---

### `depositERC20(address token, uint256 amount)`
```solidity
function depositERC20(address token, uint256 amount) external notEmergency
```
Accepts a whitelisted ERC20 token. Calls `transferFrom(msg.sender, address(this), amount)`.

> ⚠️ User must call `ERC20.approve(vaultAddress, amount)` **before** calling this function.

---

### `setRiskScore(uint256 score)`
```solidity
function setRiskScore(uint256 score) external onlyAuthorized
```
Called by the Chainlink CRE workflow every 60 seconds. If `score >= riskThreshold`, triggers `_executeEmergency()` automatically.

---

### `triggerEmergency()`
```solidity
function triggerEmergency() external onlyAuthorized
```
Manually triggers emergency using `lastRiskScore`. For authorized caller use only.

---

### `resetVault()`
```solidity
function resetVault() external onlyOwner
```
Resets `vaultState` back to `ACTIVE`. **Owner only.**

> Use after an emergency is resolved and conditions are safe again.

---

### `getUserBalance(address user, address token)`
```solidity
function getUserBalance(address user, address token) external view returns (uint256)
```
Returns a user's balance for a specific token. Pass `address(0)` for ETH.

---

### `addSupportedToken(address token)`
```solidity
function addSupportedToken(address token) external onlyOwner
```
Whitelists an ERC20 token for deposit. Cannot add `address(0)` or re-add existing tokens.

---

### `setAuthorizedCaller(address caller)`
```solidity
function setAuthorizedCaller(address caller) external onlyOwner
```
Updates the CRE workflow wallet address.

---

### `setRiskThreshold(uint256 threshold)`
```solidity
function setRiskThreshold(uint256 threshold) external onlyOwner
```
Updates the emergency trigger threshold (0–100).

---

## Internal Functions

### `_executeEmergency(uint256 score)`
```solidity
function _executeEmergency(uint256 score) internal
```
Idempotent — does nothing if already in `EMERGENCY`. Sets `vaultState = EMERGENCY`, emits `EmergencyTriggered`, then calls `_returnAllFunds()`.

---

### `_returnAllFunds()`
```solidity
function _returnAllFunds() internal
```
Iterates all `_depositors`. For each user:
- Returns ETH via `call{value: ethBal}("")`
- Returns each whitelisted ERC20 via `IERC20.transfer()`
- Safely reverts individual balance if transfer fails (no full revert)

---

## Events

| Event | Parameters | Trigger |
|---|---|---|
| `RiskScoreUpdated` | `score, timestamp` | Every `setRiskScore()` call |
| `EmergencyTriggered` | `riskScore, timestamp` | When score ≥ threshold |
| `TokenSupported` | `token` | `addSupportedToken()` |
| `DepositedETH` | `user, amount` | `depositETH()` |
| `DepositedERC20` | `user, token, amount` | `depositERC20()` |
| `FundsReturnedETH` | `user, amount` | During `_returnAllFunds()` |
| `FundsReturnedERC20` | `user, token, amount` | During `_returnAllFunds()` |

---

## Security Notes

- The `EMERGENCY` state is **one-way** by design — only the owner can reset it via `resetVault()`. This prevents re-entrancy from re-enabling deposits mid-return.
- ETH transfers use low-level `.call{value}` to avoid reverting the entire sweep if one user's receive fails.
- ERC20 transfers use `try/catch` to gracefully handle failing token contracts.
