import { parseAbi } from "viem";
import deployment from "../../deployment.json" assert { type: "json" };

export const VAULT_ADDRESS = deployment.vaultSentinel as `0x${string}`;
export const USDC_ADDRESS = deployment.mockUSDC as `0x${string}`;
export const STETH_ADDRESS = deployment.mockStETH as `0x${string}`;

// address(0) is used as the key for Native ETH inside the contract
export const ETH_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export const SUPPORTED_TOKENS = [
    { symbol: "ETH", label: "Native ETH", address: ETH_ADDRESS, decimals: 18, isNative: true },
    { symbol: "USDC", label: "Mock USDC", address: USDC_ADDRESS, decimals: 6, isNative: false },
    { symbol: "stETH", label: "Mock stETH", address: STETH_ADDRESS, decimals: 18, isNative: false },
] as const;

export const VAULT_ABI = parseAbi([
    "function depositETH() external payable",
    "function depositERC20(address token, uint256 amount) external",
    "function getUserBalance(address user, address token) external view returns (uint256)",
    "function lastRiskScore() external view returns (uint256)",
    "function vaultState() external view returns (uint8)",
    "function riskThreshold() external view returns (uint256)",
    "function triggerEmergency() external",
    "function resetVault() external",
    "event RiskScoreUpdated(uint256 score, uint256 timestamp)",
    "event EmergencyTriggered(uint256 riskScore, uint256 timestamp)",
    "event FundsReturnedETH(address indexed user, uint256 amount)",
    "event FundsReturnedERC20(address indexed user, address indexed token, uint256 amount)",
]);

export const ERC20_ABI = parseAbi([
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address owner) external view returns (uint256)",
    "function mint(address to, uint256 amount) external",
]);

export const VAULT_STATES = ["🟢 ACTIVE", "🟡 GUARDED", "🔴 EMERGENCY"] as const;
