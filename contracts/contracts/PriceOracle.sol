// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PriceOracle - "Chaos Multiplier" System
 * @dev Reflects real market TRENDS while amplifying for exciting gameplay
 * 
 * FORMULA: Final Price = Base × (1 + (OracleDelta × Amplifier)) × EventModifier
 * 
 * A 1% real move becomes a 3-5% game move.
 * Solves "Boring Reality" problem while maintaining educational value.
 */
contract PriceOracle is Ownable {
    
    // Commodity IDs
    uint256 public constant GOLD = 0;
    uint256 public constant WHEAT = 1;
    uint256 public constant SILK = 2;
    uint256 public constant SPICES = 3;
    uint256 public constant IRON = 4;
    
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant NUM_COMMODITIES = 5;
    
    // Base prices in gold coins
    mapping(uint256 => uint256) public basePrices;
    
    // Oracle trend (10000 = 100%, reflects real market)
    mapping(uint256 => uint256) public oracleTrend;
    
    // Event modifier (game events like dragon attacks)
    mapping(uint256 => uint256) public eventModifier;
    
    // Volatility amplifier (3x default - 1% real = 3% game)
    uint256 public volatilityAmplifier = 30000;
    
    // Anti-frontrunning delay
    uint256 public lastOracleUpdate;
    uint256 public oracleCommitDelay = 60; // 60 seconds
    
    // Price history
    struct PricePoint {
        uint256 price;
        uint256 timestamp;
    }
    mapping(uint256 => PricePoint[]) private priceHistory;
    uint256 public constant MAX_HISTORY = 50;
    
    // Events
    event OracleTrendUpdated(uint256 indexed commodityId, uint256 newTrend);
    event EventModifierUpdated(uint256 indexed commodityId, uint256 newModifier, string reason);
    event GameEventTriggered(string name, string description);
    
    constructor() Ownable(msg.sender) {
        // Base prices
        basePrices[GOLD] = 100;
        basePrices[WHEAT] = 10;
        basePrices[SILK] = 50;
        basePrices[SPICES] = 35;
        basePrices[IRON] = 25;
        
        // Initialize at 100%
        for (uint256 i = 0; i < NUM_COMMODITIES; i++) {
            oracleTrend[i] = BASIS_POINTS;
            eventModifier[i] = BASIS_POINTS;
        }
        
        lastOracleUpdate = block.timestamp;
    }
    
    /**
     * @dev Get final amplified price
     */
    function getPrice(uint256 commodityId) public view returns (uint256) {
        require(commodityId < NUM_COMMODITIES, "Invalid commodity");
        
        uint256 base = basePrices[commodityId];
        uint256 trend = oracleTrend[commodityId];
        uint256 eventMod = eventModifier[commodityId];
        
        // Calculate: base × amplified_trend × event_modifier
        // Amplified trend = 1 + (trend_delta × amplifier)
        
        int256 trendDelta = int256(trend) - int256(BASIS_POINTS);
        int256 amplifiedDelta = (trendDelta * int256(volatilityAmplifier)) / int256(BASIS_POINTS);
        
        int256 trendedPrice = int256(base) + (int256(base) * amplifiedDelta / int256(BASIS_POINTS));
        
        // Apply event modifier
        int256 finalPrice = (trendedPrice * int256(eventMod)) / int256(BASIS_POINTS);
        
        // Min 10% of base
        if (finalPrice < int256(base / 10)) {
            finalPrice = int256(base / 10);
        }
        
        return uint256(finalPrice);
    }
    
    /**
     * @dev Get all prices
     */
    function getAllPrices() external view returns (uint256[] memory) {
        uint256[] memory prices = new uint256[](NUM_COMMODITIES);
        for (uint256 i = 0; i < NUM_COMMODITIES; i++) {
            prices[i] = getPrice(i);
        }
        return prices;
    }
    
    /**
     * @dev Get price breakdown for transparency
     */
    function getPriceBreakdown(uint256 commodityId) external view returns (
        uint256 basePrice,
        uint256 trend,
        uint256 eventMod,
        uint256 amplifier,
        uint256 finalPrice
    ) {
        return (
            basePrices[commodityId],
            oracleTrend[commodityId],
            eventModifier[commodityId],
            volatilityAmplifier,
            getPrice(commodityId)
        );
    }
    
    // ============ ORACLE UPDATES ============
    
    /**
     * @dev Update oracle trends (from real market data)
     */
    function updateOracleTrends(uint256[] calldata newTrends) external onlyOwner {
        require(newTrends.length == NUM_COMMODITIES, "Must provide 5 trends");
        
        for (uint256 i = 0; i < NUM_COMMODITIES; i++) {
            require(newTrends[i] >= 5000 && newTrends[i] <= 20000, "Out of range");
            oracleTrend[i] = newTrends[i];
            emit OracleTrendUpdated(i, newTrends[i]);
            _recordPrice(i);
        }
        
        lastOracleUpdate = block.timestamp;
    }
    
    /**
     * @dev Update single commodity trend
     */
    function updateSingleTrend(uint256 commodityId, uint256 newTrend) external onlyOwner {
        require(commodityId < NUM_COMMODITIES, "Invalid commodity");
        require(newTrend >= 5000 && newTrend <= 20000, "Out of range");
        
        oracleTrend[commodityId] = newTrend;
        emit OracleTrendUpdated(commodityId, newTrend);
        _recordPrice(commodityId);
        
        lastOracleUpdate = block.timestamp;
    }
    
    // ============ GAME EVENTS ============
    
    /**
     * @dev Trigger a game event (dragon attack, harvest, etc.)
     */
    function triggerGameEvent(
        string calldata name,
        string calldata description,
        uint256[] calldata commodityIds,
        uint256[] calldata newModifiers
    ) external onlyOwner {
        require(commodityIds.length == newModifiers.length, "Array mismatch");
        
        for (uint256 i = 0; i < commodityIds.length; i++) {
            require(commodityIds[i] < NUM_COMMODITIES, "Invalid commodity");
            require(newModifiers[i] >= 5000 && newModifiers[i] <= 20000, "Out of range");
            
            eventModifier[commodityIds[i]] = newModifiers[i];
            emit EventModifierUpdated(commodityIds[i], newModifiers[i], name);
            _recordPrice(commodityIds[i]);
        }
        
        emit GameEventTriggered(name, description);
    }
    
    /**
     * @dev Reset event modifiers to normal
     */
    function resetEventModifiers() external onlyOwner {
        for (uint256 i = 0; i < NUM_COMMODITIES; i++) {
            eventModifier[i] = BASIS_POINTS;
            emit EventModifierUpdated(i, BASIS_POINTS, "Reset");
        }
    }
    
    // ============ CONFIGURATION ============
    
    function setVolatilityAmplifier(uint256 newAmp) external onlyOwner {
        require(newAmp >= 10000 && newAmp <= 100000, "Must be 1x-10x");
        volatilityAmplifier = newAmp;
    }
    
    function setOracleCommitDelay(uint256 newDelay) external onlyOwner {
        require(newDelay <= 3600, "Max 1 hour");
        oracleCommitDelay = newDelay;
    }
    
    // ============ VIEW HELPERS ============
    
    function getCommodityName(uint256 commodityId) external pure returns (string memory) {
        if (commodityId == GOLD) return "Gold";
        if (commodityId == WHEAT) return "Wheat";
        if (commodityId == SILK) return "Silk";
        if (commodityId == SPICES) return "Spices";
        if (commodityId == IRON) return "Iron";
        revert("Invalid commodity");
    }
    
    function getPriceHistory(uint256 commodityId, uint256 limit) 
        external 
        view 
        returns (PricePoint[] memory) 
    {
        require(commodityId < NUM_COMMODITIES, "Invalid commodity");
        
        PricePoint[] storage history = priceHistory[commodityId];
        uint256 len = history.length;
        
        if (limit > len) limit = len;
        if (limit == 0) return new PricePoint[](0);
        
        PricePoint[] memory result = new PricePoint[](limit);
        for (uint256 i = 0; i < limit; i++) {
            result[i] = history[len - limit + i];
        }
        
        return result;
    }
    
    // ============ INTERNAL ============
    
    function _recordPrice(uint256 commodityId) internal {
        PricePoint[] storage history = priceHistory[commodityId];
        
        if (history.length >= MAX_HISTORY) {
            // Shift (simple, gas expensive but ok for hackathon)
            for (uint256 i = 0; i < MAX_HISTORY - 1; i++) {
                history[i] = history[i + 1];
            }
            history.pop();
        }
        
        history.push(PricePoint({
            price: getPrice(commodityId),
            timestamp: block.timestamp
        }));
    }
}
