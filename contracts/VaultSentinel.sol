// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract VaultSentinel is Ownable {
    enum VaultState { ACTIVE, GUARDED, EMERGENCY }

    address public authorizedCaller;    // CRE workflow address
    uint256 public riskThreshold;       // score 0-100 that triggers emergency
    VaultState public vaultState;
    uint256 public lastRiskScore;

    // Token whitelisting
    mapping(address => bool) public isSupportedToken;
    address[] public supportedTokensList;

    // user => token => balance. address(0) represents Native ETH.
    mapping(address => mapping(address => uint256)) private _balances;
    
    address[] private _depositors;
    mapping(address => bool) private _isDepositor;

    event RiskScoreUpdated(uint256 score, uint256 timestamp);
    event EmergencyTriggered(uint256 riskScore, uint256 timestamp);
    event TokenSupported(address indexed token);
    event DepositedETH(address indexed user, uint256 amount);
    event DepositedERC20(address indexed user, address indexed token, uint256 amount);
    event FundsReturnedETH(address indexed user, uint256 amount);
    event FundsReturnedERC20(address indexed user, address indexed token, uint256 amount);

    modifier onlyAuthorized() {
        require(msg.sender == authorizedCaller || msg.sender == owner(), "Unauthorized");
        _;
    }

    modifier notEmergency() {
        require(vaultState != VaultState.EMERGENCY, "Vault is in emergency");
        _;
    }

    constructor(address authorizedCaller_, uint256 riskThreshold_)
        Ownable(msg.sender)
    {
        authorizedCaller = authorizedCaller_;
        riskThreshold = riskThreshold_;
        vaultState = VaultState.ACTIVE;
    }

    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "Cannot add address(0)");
        require(!isSupportedToken[token], "Already supported");
        isSupportedToken[token] = true;
        supportedTokensList.push(token);
        emit TokenSupported(token);
    }

    function _checkAndAddDepositor(address user) internal {
        if (!_isDepositor[user]) {
            _isDepositor[user] = true;
            _depositors.push(user);
        }
    }

    // Accepts native ETH
    function depositETH() external payable notEmergency {
        require(msg.value > 0, "Amount must be > 0");
        _checkAndAddDepositor(msg.sender);
        
        _balances[msg.sender][address(0)] += msg.value;
        emit DepositedETH(msg.sender, msg.value);
    }

    // Accepts supported ERC20 tokens
    function depositERC20(address token, uint256 amount) external notEmergency {
        require(amount > 0, "Amount must be > 0");
        require(isSupportedToken[token], "Token not supported");
        _checkAndAddDepositor(msg.sender);

        bool success = IERC20(token).transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");

        _balances[msg.sender][token] += amount;
        emit DepositedERC20(msg.sender, token, amount);
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
            
            // Return ETH
            uint256 ethBal = _balances[user][address(0)];
            if (ethBal > 0) {
                _balances[user][address(0)] = 0;
                (bool success, ) = user.call{value: ethBal}("");
                if (success) {
                    emit FundsReturnedETH(user, ethBal);
                } else {
                    _balances[user][address(0)] = ethBal; // revert state if transfer fails
                }
            }

            // Return all supported ERC20s
            for (uint256 j = 0; j < supportedTokensList.length; j++) {
                address token = supportedTokensList[j];
                uint256 bal = _balances[user][token];
                if (bal > 0) {
                    _balances[user][token] = 0;
                    try IERC20(token).transfer(user, bal) returns (bool success) {
                        if (success) {
                            emit FundsReturnedERC20(user, token, bal);
                        } else {
                            _balances[user][token] = bal;
                        }
                    } catch {
                        _balances[user][token] = bal;
                    }
                }
            }
        }
    }

    function getUserBalance(address user, address token) external view returns (uint256) {
        return _balances[user][token];
    }

    function resetVault() external onlyOwner {
        vaultState = VaultState.ACTIVE;
    }

    function setAuthorizedCaller(address caller) external onlyOwner {
        authorizedCaller = caller;
    }

    function setRiskThreshold(uint256 threshold) external onlyOwner {
        require(threshold <= 100, "Threshold must be 0-100");
        riskThreshold = threshold;
    }
}
