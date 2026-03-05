// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VaultSentinel is Ownable {
    enum VaultState { ACTIVE, GUARDED, EMERGENCY }

    IERC20 public immutable token;
    address public authorizedCaller;    // CRE workflow address
    uint256 public riskThreshold;       // score 0-100 that triggers emergency
    VaultState public vaultState;
    uint256 public lastRiskScore;

    mapping(address => uint256) private _balances;
    address[] private _depositors;      // track depositors for mass fund return

    event RiskScoreUpdated(uint256 score, uint256 timestamp);
    event EmergencyTriggered(uint256 riskScore, uint256 timestamp);
    event FundsReturned(address indexed user, uint256 amount);
    event Deposited(address indexed user, uint256 amount);

    modifier onlyAuthorized() {
        require(msg.sender == authorizedCaller || msg.sender == owner(), "Unauthorized");
        _;
    }

    modifier notEmergency() {
        require(vaultState != VaultState.EMERGENCY, "Vault is in emergency");
        _;
    }

    constructor(address token_, address authorizedCaller_, uint256 riskThreshold_)
        Ownable(msg.sender)
    {
        token = IERC20(token_);
        authorizedCaller = authorizedCaller_;
        riskThreshold = riskThreshold_;
        vaultState = VaultState.ACTIVE;
    }

    function deposit(uint256 amount) external notEmergency {
        require(amount > 0, "Amount must be > 0");
        token.transferFrom(msg.sender, address(this), amount);
        if (_balances[msg.sender] == 0) {
            _depositors.push(msg.sender);
        }
        _balances[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    function setRiskScore(uint256 score) external onlyAuthorized {
        require(score <= 100, "Score must be 0-100");
        lastRiskScore = score;
        emit RiskScoreUpdated(score, block.timestamp);
        if (score >= riskThreshold) {
            _executeEmergency(score);
        }
    }

    function triggerEmergency() external onlyAuthorized {
        _executeEmergency(lastRiskScore);
    }

    function _executeEmergency(uint256 score) internal {
        if (vaultState == VaultState.EMERGENCY) return; // idempotent
        vaultState = VaultState.EMERGENCY;
        emit EmergencyTriggered(score, block.timestamp);
        _returnAllFunds();
    }

    function _returnAllFunds() internal {
        for (uint256 i = 0; i < _depositors.length; i++) {
            address user = _depositors[i];
            uint256 bal = _balances[user];
            if (bal > 0) {
                _balances[user] = 0;
                token.transfer(user, bal);
                emit FundsReturned(user, bal);
            }
        }
    }

    function getUserBalance(address user) external view returns (uint256) {
        return _balances[user];
    }

    function resetVault() external onlyOwner {
        vaultState = VaultState.ACTIVE;
        // Note: _depositors array is intentionally kept for re-depositors
    }

    function setAuthorizedCaller(address caller) external onlyOwner {
        authorizedCaller = caller;
    }

    function setRiskThreshold(uint256 threshold) external onlyOwner {
        require(threshold <= 100, "Threshold must be 0-100");
        riskThreshold = threshold;
    }
}
