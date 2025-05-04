// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title AhsanVerseToken
 * @dev Implementation of the AhsanVerse Token with built-in ICO functionality
 */
contract AhsanVerseToken is ERC20, Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    
    // Token distribution
    uint256 public constant TOTAL_SUPPLY = 531000000 * 10**18; // 531 million tokens
    uint256 public constant PRESALE_SUPPLY = 265500000 * 10**18; // 50% for presale
    uint256 public constant LIQUIDITY_SUPPLY = 106200000 * 10**18; // 20% for liquidity
    uint256 public constant TEAM_SUPPLY = 79650000 * 10**18; // 15% for team (locked)
    uint256 public constant DEVELOPMENT_SUPPLY = 53100000 * 10**18; // 10% for development
    uint256 public constant MARKETING_SUPPLY = 26550000 * 10**18; // 5% for marketing
    
    // Sale parameters
    uint256 public tokenPrice = 0.00033 ether; // 1 ETH = 3000 tokens initially
    uint256 public nextStagePrice = 0.00047 ether; // Price for next stage
    uint256 public minContribution = 0.01 ether;
    uint256 public maxContribution = 10 ether;
    uint256 public tokensSold = 0;
    bool public saleActive = true;
    
    // Team token locking
    uint256 public constant TEAM_LOCK_DURATION = 730 days; // 2 years
    uint256 public teamUnlockTime;
    
    // Events
    event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount);
    event PriceUpdated(uint256 newPrice);
    event SaleStatusChanged(bool isActive);
    
    /**
     * @dev Constructor that initializes the token and distributes initial supply
     */
    constructor() ERC20("AhsanVerse Token", "AHV") {
        // Mint total supply
        _mint(address(this), TOTAL_SUPPLY);
        
        // Set team token unlock time
        teamUnlockTime = block.timestamp + TEAM_LOCK_DURATION;
        
        // Transfer marketing and development funds to owner
        _transfer(address(this), owner(), MARKETING_SUPPLY.add(DEVELOPMENT_SUPPLY));
    }
    
    /**
     * @dev Function to buy tokens directly with ETH
     */
    function buyTokens() external payable nonReentrant {
        require(saleActive, "Token sale is not active");
        require(msg.value >= minContribution, "Contribution below minimum");
        require(msg.value <= maxContribution, "Contribution above maximum");
        
        uint256 tokenAmount = getTokenAmount(msg.value);
        require(tokenAmount > 0, "Token amount too small");
        require(tokensSold.add(tokenAmount) <= PRESALE_SUPPLY, "Not enough tokens left");
        
        // Update tokens sold
        tokensSold = tokensSold.add(tokenAmount);
        
        // Transfer tokens to buyer
        _transfer(address(this), msg.sender, tokenAmount);
        
        // Emit event
        emit TokensPurchased(msg.sender, msg.value, tokenAmount);
    }
    
    /**
     * @dev Function to get token amount based on ETH amount
     * @param ethAmount The amount of ETH sent
     * @return The amount of tokens that can be purchased
     */
    function getTokenAmount(uint256 ethAmount) public view returns (uint256) {
        return ethAmount.mul(10**18).div(tokenPrice);
    }
    
    /**
     * @dev Function to get current token price
     * @return Current token price in ETH
     */
    function getTokenPrice() external view returns (uint256) {
        return tokenPrice;
    }
    
    /**
     * @dev Function to get tokens sold so far
     * @return Number of tokens sold
     */
    function getTokensSold() external view returns (uint256) {
        return tokensSold;
    }
    
    /**
     * @dev Function to get remaining tokens available for sale
     * @return Number of tokens left for sale
     */
    function getRemainingTokens() external view returns (uint256) {
        return PRESALE_SUPPLY.sub(tokensSold);
    }
    
    /**
     * @dev Function to get minimum contribution
     * @return Minimum amount of ETH that can be contributed
     */
    function getMinContribution() external view returns (uint256) {
        return minContribution;
    }
    
    /**
     * @dev Function to get maximum contribution
     * @return Maximum amount of ETH that can be contributed
     */
    function getMaxContribution() external view returns (uint256) {
        return maxContribution;
    }
    
    /**
     * @dev Function to check if sale is active
     * @return Boolean indicating if sale is active
     */
    function isSaleActive() external view returns (bool) {
        return saleActive;
    }
    
    /**
     * @dev Function to update token price - only owner
     * @param newPrice New token price in ETH
     */
    function updateTokenPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Price must be greater than 0");
        tokenPrice = newPrice;
        emit PriceUpdated(newPrice);
    }
    
    /**
     * @dev Function to toggle sale status - only owner
     * @param _saleActive New sale status
     */
    function setSaleStatus(bool _saleActive) external onlyOwner {
        saleActive = _saleActive;
        emit SaleStatusChanged(_saleActive);
    }
    
    /**
     * @dev Function to update contribution limits - only owner
     * @param _minContribution New minimum contribution
     * @param _maxContribution New maximum contribution
     */
    function setContributionLimits(uint256 _minContribution, uint256 _maxContribution) external onlyOwner {
        require(_minContribution > 0, "Min contribution must be greater than 0");
        require(_maxContribution >= _minContribution, "Max must be greater than min");
        minContribution = _minContribution;
        maxContribution = _maxContribution;
    }
    
    /**
     * @dev Function to release team tokens after lock period
     */
    function releaseTeamTokens() external onlyOwner {
        require(block.timestamp >= teamUnlockTime, "Team tokens are still locked");
        require(balanceOf(address(this)) >= TEAM_SUPPLY, "Insufficient tokens in contract");
        
        // Transfer team tokens to owner
        _transfer(address(this), owner(), TEAM_SUPPLY);
    }
    
    /**
     * @dev Function to withdraw ETH collected from sales - only owner
     */
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Function to release liquidity tokens for exchange listings - only owner
     * @param to Address to send liquidity tokens to
     * @param amount Amount of tokens to release for liquidity
     */
    function releaseLiquidityTokens(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot release to zero address");
        require(amount <= LIQUIDITY_SUPPLY, "Amount exceeds liquidity allocation");
        require(balanceOf(address(this)) >= amount, "Insufficient tokens in contract");
        
        // Transfer liquidity tokens
        _transfer(address(this), to, amount);
    }
    
    // Receive function to accept ETH
    receive() external payable {
        // Auto-convert ETH to tokens if sale is active
        if (saleActive && msg.value >= minContribution && msg.value <= maxContribution) {
            uint256 tokenAmount = getTokenAmount(msg.value);
            if (tokenAmount > 0 && tokensSold.add(tokenAmount) <= PRESALE_SUPPLY) {
                tokensSold = tokensSold.add(tokenAmount);
                _transfer(address(this), msg.sender, tokenAmount);
                emit TokensPurchased(msg.sender, msg.value, tokenAmount);
            }
        }
    }
} 