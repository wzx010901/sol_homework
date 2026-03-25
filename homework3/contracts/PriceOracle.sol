// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PriceOracle
 * @notice Contract to get price feeds from Chainlink for ETH and ERC20 tokens
 */
contract PriceOracle is Ownable {
    
    // Mapping from token address to price feed address
    mapping(address => AggregatorV3Interface) public priceFeeds;
    
    // Mapping to check if a token has a price feed
    mapping(address => bool) public hasPriceFeed;
    
    // Price feed for ETH/USD
    AggregatorV3Interface public ethUsdPriceFeed;
    
    // Decimals for USD price (8 decimals for Chainlink USD feeds)
    uint8 public constant USD_DECIMALS = 8;
    
    // Decimals for ETH (18 decimals)
    uint8 public constant ETH_DECIMALS = 18;
    
    event PriceFeedAdded(address indexed token, address indexed priceFeed);
    event PriceFeedRemoved(address indexed token);
    event EthUsdPriceFeedUpdated(address indexed priceFeed);
    
    constructor(address _ethUsdPriceFeed) Ownable(msg.sender) {
        require(_ethUsdPriceFeed != address(0), "PriceOracle: invalid ETH/USD price feed");
        ethUsdPriceFeed = AggregatorV3Interface(_ethUsdPriceFeed);
        emit EthUsdPriceFeedUpdated(_ethUsdPriceFeed);
    }
    
    /**
     * @notice Add a price feed for a token
     * @param token The token address
     * @param priceFeed The Chainlink price feed address
     */
    function addPriceFeed(address token, address priceFeed) external onlyOwner {
        require(token != address(0), "PriceOracle: invalid token address");
        require(priceFeed != address(0), "PriceOracle: invalid price feed address");
        
        priceFeeds[token] = AggregatorV3Interface(priceFeed);
        hasPriceFeed[token] = true;
        
        emit PriceFeedAdded(token, priceFeed);
    }
    
    /**
     * @notice Remove a price feed for a token
     * @param token The token address
     */
    function removePriceFeed(address token) external onlyOwner {
        require(hasPriceFeed[token], "PriceOracle: no price feed for token");
        
        delete priceFeeds[token];
        hasPriceFeed[token] = false;
        
        emit PriceFeedRemoved(token);
    }
    
    /**
     * @notice Update the ETH/USD price feed
     * @param _ethUsdPriceFeed The new ETH/USD price feed address
     */
    function setEthUsdPriceFeed(address _ethUsdPriceFeed) external onlyOwner {
        require(_ethUsdPriceFeed != address(0), "PriceOracle: invalid price feed");
        ethUsdPriceFeed = AggregatorV3Interface(_ethUsdPriceFeed);
        emit EthUsdPriceFeedUpdated(_ethUsdPriceFeed);
    }
    
    /**
     * @notice Get the latest ETH price in USD
     * @return price The ETH price in USD (8 decimals)
     * @return timestamp The timestamp of the price update
     */
    function getEthPrice() public view returns (uint256 price, uint256 timestamp) {
        (
            uint80 roundID,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = ethUsdPriceFeed.latestRoundData();
        
        require(answer > 0, "PriceOracle: invalid ETH price");
        require(updatedAt > 0, "PriceOracle: incomplete round");
        
        // Check if price is not stale (within 1 hour)
        require(block.timestamp - updatedAt <= 3600, "PriceOracle: stale ETH price");
        
        return (uint256(answer), updatedAt);
    }
    
    /**
     * @notice Get the latest token price in USD
     * @param token The token address
     * @return price The token price in USD (8 decimals)
     * @return timestamp The timestamp of the price update
     */
    function getTokenPrice(address token) public view returns (uint256 price, uint256 timestamp) {
        require(hasPriceFeed[token], "PriceOracle: no price feed for token");
        
        (
            uint80 roundID,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeeds[token].latestRoundData();
        
        require(answer > 0, "PriceOracle: invalid token price");
        require(updatedAt > 0, "PriceOracle: incomplete round");
        
        // Check if price is not stale (within 1 hour)
        require(block.timestamp - updatedAt <= 3600, "PriceOracle: stale token price");
        
        return (uint256(answer), updatedAt);
    }
    
    /**
     * @notice Convert ETH amount to USD value
     * @param ethAmount The amount of ETH (18 decimals)
     * @return usdValue The USD value (8 decimals)
     */
    function ethToUsd(uint256 ethAmount) public view returns (uint256 usdValue) {
        (uint256 ethPrice, ) = getEthPrice();
        
        // ethAmount is in 18 decimals, ethPrice is in 8 decimals
        // Result should be in 8 decimals
        usdValue = (ethAmount * ethPrice) / 10**ETH_DECIMALS;
        
        return usdValue;
    }
    
    /**
     * @notice Convert token amount to USD value
     * @param token The token address
     * @param tokenAmount The amount of tokens
     * @param tokenDecimals The decimals of the token
     * @return usdValue The USD value (8 decimals)
     */
    function tokenToUsd(address token, uint256 tokenAmount, uint8 tokenDecimals) 
        public 
        view 
        returns (uint256 usdValue) 
    {
        (uint256 tokenPrice, ) = getTokenPrice(token);
        
        // tokenAmount is in tokenDecimals, tokenPrice is in 8 decimals
        // Result should be in 8 decimals
        usdValue = (tokenAmount * tokenPrice) / 10**tokenDecimals;
        
        return usdValue;
    }
    
    /**
     * @notice Convert USD value to ETH amount
     * @param usdValue The USD value (8 decimals)
     * @return ethAmount The ETH amount (18 decimals)
     */
    function usdToEth(uint256 usdValue) public view returns (uint256 ethAmount) {
        (uint256 ethPrice, ) = getEthPrice();
        
        // usdValue is in 8 decimals, ethPrice is in 8 decimals
        // Result should be in 18 decimals
        ethAmount = (usdValue * 10**ETH_DECIMALS) / ethPrice;
        
        return ethAmount;
    }
    
    /**
     * @notice Convert USD value to token amount
     * @param token The token address
     * @param usdValue The USD value (8 decimals)
     * @param tokenDecimals The decimals of the token
     * @return tokenAmount The token amount
     */
    function usdToToken(address token, uint256 usdValue, uint8 tokenDecimals) 
        public 
        view 
        returns (uint256 tokenAmount) 
    {
        (uint256 tokenPrice, ) = getTokenPrice(token);
        
        // usdValue is in 8 decimals, tokenPrice is in 8 decimals
        // Result should be in tokenDecimals
        tokenAmount = (usdValue * 10**tokenDecimals) / tokenPrice;
        
        return tokenAmount;
    }
    
    /**
     * @notice Compare two bids in USD value
     * @param bid1Amount First bid amount
     * @param bid1Token First bid token address (address(0) for ETH)
     * @param bid1Decimals First bid token decimals
     * @param bid2Amount Second bid amount
     * @param bid2Token Second bid token address (address(0) for ETH)
     * @param bid2Decimals Second bid token decimals
     * @return comparison 1 if bid1 > bid2, 0 if equal, -1 if bid1 < bid2
     */
    function compareBids(
        uint256 bid1Amount,
        address bid1Token,
        uint8 bid1Decimals,
        uint256 bid2Amount,
        address bid2Token,
        uint8 bid2Decimals
    ) external view returns (int8 comparison) {
        uint256 bid1Usd;
        uint256 bid2Usd;
        
        // Convert bid 1 to USD
        if (bid1Token == address(0)) {
            bid1Usd = ethToUsd(bid1Amount);
        } else {
            bid1Usd = tokenToUsd(bid1Token, bid1Amount, bid1Decimals);
        }
        
        // Convert bid 2 to USD
        if (bid2Token == address(0)) {
            bid2Usd = ethToUsd(bid2Amount);
        } else {
            bid2Usd = tokenToUsd(bid2Token, bid2Amount, bid2Decimals);
        }
        
        if (bid1Usd > bid2Usd) {
            return 1;
        } else if (bid1Usd < bid2Usd) {
            return -1;
        } else {
            return 0;
        }
    }
    
    /**
     * @notice Get the number of decimals for ETH/USD price feed
     */
    function getEthPriceDecimals() external view returns (uint8) {
        return ethUsdPriceFeed.decimals();
    }
    
    /**
     * @notice Get the number of decimals for a token price feed
     * @param token The token address
     */
    function getTokenPriceDecimals(address token) external view returns (uint8) {
        require(hasPriceFeed[token], "PriceOracle: no price feed for token");
        return priceFeeds[token].decimals();
    }
}