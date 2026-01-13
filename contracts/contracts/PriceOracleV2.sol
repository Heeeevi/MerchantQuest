// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IPyth - Minimal interface for Pyth Network
 */
interface IPyth {
    struct Price {
        int64 price;
        uint64 conf;
        int32 expo;
        uint256 publishTime;
    }

    function getPriceNoOlderThan(bytes32 id, uint age) external view returns (Price memory price);
    function getPrice(bytes32 id) external view returns (Price memory price);
    function updatePriceFeeds(bytes[] calldata updateData) external payable;
    function getUpdateFee(bytes[] calldata updateData) external view returns (uint feeAmount);
}

/**
 * @title PriceOracleV2 - Real Market Data Integration
 * @dev Integrates with Pyth Network for real-time commodity prices on Mantle Sepolia
 * 
 * Maps game commodities to real-world assets:
 * - Gold (game) → XAU/USD (real gold price)
 * - Wheat (game) → Derived from agricultural index
 * - Silk (game) → Derived from textile/commodity basket
 * - Spices (game) → Derived from spice index proxy
 * - Iron (game) → Derived from base metals
 * 
 * Uses "Chaos Multiplier" to amplify real movements for exciting gameplay
 */
contract PriceOracleV2 is Ownable {
    
    // ============ PYTH INTEGRATION ============
    IPyth public pyth;
    
    // Pyth Price Feed IDs (Stable channel for EVM)
    // These are real Pyth price feed IDs
    bytes32 public constant PYTH_XAU_USD = 0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2; // Gold
    bytes32 public constant PYTH_XAG_USD = 0xf2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e; // Silver
    bytes32 public constant PYTH_WTI_USD = 0xc7b72e5d860034288c9335d4d325da4272fe50c92ab72249d58f6cbba30e4c44; // WTI Oil
    bytes32 public constant PYTH_ETH_USD = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace; // ETH
    bytes32 public constant PYTH_BTC_USD = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43; // BTC
    
    // ============ CONSTANTS ============
    uint256 public constant GOLD = 0;
    uint256 public constant WHEAT = 1;
    uint256 public constant SILK = 2;
    uint256 public constant SPICES = 3;
    uint256 public constant IRON = 4;
    
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant NUM_COMMODITIES = 5;
    
    // ============ PRICE CONFIGURATION ============
    
    // Base prices in game gold (for scaling)
    mapping(uint256 => uint256) public basePrices;
    
    // Reference prices when oracle was initialized (for calculating deltas)
    mapping(uint256 => int256) public referencePrices;
    
    // Event modifier (game events like dragon attacks)
    mapping(uint256 => uint256) public eventModifier;
    
    // Volatility amplifier (3x default)
    uint256 public volatilityAmplifier = 30000; // 300% = 3x
    
    // Maximum price age for Pyth data (5 minutes)
    uint256 public maxPriceAge = 300;
    
    // Fallback mode if Pyth is unavailable
    bool public useFallback = false;
    mapping(uint256 => uint256) public fallbackPrices;
    
    // Price history
    struct PricePoint {
        uint256 price;
        uint256 timestamp;
    }
    mapping(uint256 => PricePoint[]) private priceHistory;
    uint256 public constant MAX_HISTORY = 50;
    
    // ============ EVENTS ============
    event PythUpdated(address indexed newPyth);
    event EventModifierUpdated(uint256 indexed commodityId, uint256 newModifier, string reason);
    event GameEventTriggered(string name, string description);
    event FallbackModeChanged(bool useFallback);
    event ReferencePriceUpdated(uint256 indexed commodityId, int256 newReference);
    
    // ============ CONSTRUCTOR ============
    
    constructor(address _pythAddress) Ownable(msg.sender) {
        pyth = IPyth(_pythAddress);
        
        // Base prices in game gold
        basePrices[GOLD] = 100;
        basePrices[WHEAT] = 10;
        basePrices[SILK] = 50;
        basePrices[SPICES] = 35;
        basePrices[IRON] = 25;
        
        // Initialize event modifiers at 100%
        for (uint256 i = 0; i < NUM_COMMODITIES; i++) {
            eventModifier[i] = BASIS_POINTS;
            fallbackPrices[i] = basePrices[i];
        }
        
        // Initialize reference prices from current Pyth data
        _initializeReferencePrices();
    }
    
    // ============ MAIN PRICE FUNCTIONS ============
    
    /**
     * @dev Get the current game price for a commodity
     * Formula: BasePrice × (1 + AmplifiedDelta) × EventModifier
     */
    function getPrice(uint256 commodityId) public view returns (uint256) {
        require(commodityId < NUM_COMMODITIES, "Invalid commodity");
        
        if (useFallback) {
            return _applyEventModifier(commodityId, fallbackPrices[commodityId]);
        }
        
        uint256 base = basePrices[commodityId];
        int256 priceDelta = _getPriceDeltaFromPyth(commodityId);
        
        // Amplify the delta: small real moves become bigger game moves
        int256 amplifiedDelta = (priceDelta * int256(volatilityAmplifier)) / int256(BASIS_POINTS);
        
        // Calculate new price
        int256 newPrice = int256(base) + (int256(base) * amplifiedDelta / int256(BASIS_POINTS));
        
        // Minimum 10% of base
        if (newPrice < int256(base / 10)) {
            newPrice = int256(base / 10);
        }
        
        // Maximum 500% of base
        if (newPrice > int256(base * 5)) {
            newPrice = int256(base * 5);
        }
        
        return _applyEventModifier(commodityId, uint256(newPrice));
    }
    
    /**
     * @dev Get all commodity prices at once
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
        int256 pythDelta,
        uint256 eventMod,
        uint256 amplifier,
        uint256 finalPrice,
        bool usingFallback
    ) {
        return (
            basePrices[commodityId],
            _getPriceDeltaFromPyth(commodityId),
            eventModifier[commodityId],
            volatilityAmplifier,
            getPrice(commodityId),
            useFallback
        );
    }
    
    /**
     * @dev Get raw Pyth price for a commodity
     */
    function getRawPythPrice(uint256 commodityId) external view returns (int256 price, uint256 publishTime) {
        bytes32 feedId = _getPythFeedId(commodityId);
        if (feedId == bytes32(0)) {
            return (0, 0);
        }
        
        try pyth.getPriceNoOlderThan(feedId, maxPriceAge) returns (IPyth.Price memory pythPrice) {
            // Convert to standard decimal (8 decimals)
            int256 normalizedPrice = _normalizePrice(pythPrice.price, pythPrice.expo);
            return (normalizedPrice, pythPrice.publishTime);
        } catch {
            return (0, 0);
        }
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
        }
        
        emit GameEventTriggered(name, description);
    }
    
    /**
     * @dev Reset all event modifiers to normal
     */
    function resetEventModifiers() external onlyOwner {
        for (uint256 i = 0; i < NUM_COMMODITIES; i++) {
            eventModifier[i] = BASIS_POINTS;
            emit EventModifierUpdated(i, BASIS_POINTS, "Reset");
        }
    }
    
    // ============ CONFIGURATION ============
    
    function setPythAddress(address _pythAddress) external onlyOwner {
        pyth = IPyth(_pythAddress);
        emit PythUpdated(_pythAddress);
    }
    
    function setVolatilityAmplifier(uint256 newAmp) external onlyOwner {
        require(newAmp >= 10000 && newAmp <= 100000, "Must be 1x-10x");
        volatilityAmplifier = newAmp;
    }
    
    function setMaxPriceAge(uint256 newAge) external onlyOwner {
        require(newAge >= 60 && newAge <= 3600, "60s to 1hr");
        maxPriceAge = newAge;
    }
    
    function setFallbackMode(bool _useFallback) external onlyOwner {
        useFallback = _useFallback;
        emit FallbackModeChanged(_useFallback);
    }
    
    function setFallbackPrices(uint256[] calldata prices) external onlyOwner {
        require(prices.length == NUM_COMMODITIES, "Must provide 5 prices");
        for (uint256 i = 0; i < NUM_COMMODITIES; i++) {
            fallbackPrices[i] = prices[i];
        }
    }
    
    /**
     * @dev Update reference prices to current Pyth prices
     * Call this to "reset" the baseline for delta calculation
     */
    function updateReferencePrices() external onlyOwner {
        _initializeReferencePrices();
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
    
    // ============ INTERNAL FUNCTIONS ============
    
    function _initializeReferencePrices() internal {
        // Gold → XAU
        referencePrices[GOLD] = _fetchPythPrice(PYTH_XAU_USD);
        
        // Wheat → Use BTC as proxy (agricultural commodities not on Pyth testnet)
        // In production, would use CBOT Wheat futures
        referencePrices[WHEAT] = _fetchPythPrice(PYTH_ETH_USD) / 100; // Scaled down
        
        // Silk → Use ETH as proxy for luxury goods
        referencePrices[SILK] = _fetchPythPrice(PYTH_ETH_USD);
        
        // Spices → Use Silver as proxy (historically traded together)
        referencePrices[SPICES] = _fetchPythPrice(PYTH_XAG_USD);
        
        // Iron → Use WTI as proxy for industrial commodities
        referencePrices[IRON] = _fetchPythPrice(PYTH_WTI_USD);
        
        for (uint256 i = 0; i < NUM_COMMODITIES; i++) {
            emit ReferencePriceUpdated(i, referencePrices[i]);
        }
    }
    
    function _fetchPythPrice(bytes32 feedId) internal view returns (int256) {
        try pyth.getPriceNoOlderThan(feedId, maxPriceAge) returns (IPyth.Price memory pythPrice) {
            return _normalizePrice(pythPrice.price, pythPrice.expo);
        } catch {
            return 0;
        }
    }
    
    function _getPriceDeltaFromPyth(uint256 commodityId) internal view returns (int256) {
        bytes32 feedId = _getPythFeedId(commodityId);
        if (feedId == bytes32(0)) {
            return 0;
        }
        
        int256 currentPrice = _fetchPythPrice(feedId);
        int256 refPrice = referencePrices[commodityId];
        
        if (refPrice == 0 || currentPrice == 0) {
            return 0;
        }
        
        // Calculate percentage change in basis points
        // delta = (current - reference) / reference * 10000
        int256 delta = ((currentPrice - refPrice) * int256(BASIS_POINTS)) / refPrice;
        
        return delta;
    }
    
    function _getPythFeedId(uint256 commodityId) internal pure returns (bytes32) {
        if (commodityId == GOLD) return PYTH_XAU_USD;
        if (commodityId == WHEAT) return PYTH_ETH_USD;  // Proxy
        if (commodityId == SILK) return PYTH_ETH_USD;   // Proxy
        if (commodityId == SPICES) return PYTH_XAG_USD; // Proxy
        if (commodityId == IRON) return PYTH_WTI_USD;   // Proxy
        return bytes32(0);
    }
    
    function _normalizePrice(int64 price, int32 expo) internal pure returns (int256) {
        // Normalize to 8 decimal places
        if (expo >= 0) {
            return int256(price) * int256(10 ** uint32(expo + 8));
        } else {
            uint32 absExpo = uint32(-expo);
            if (absExpo <= 8) {
                return int256(price) * int256(10 ** (8 - absExpo));
            } else {
                return int256(price) / int256(10 ** (absExpo - 8));
            }
        }
    }
    
    function _applyEventModifier(uint256 commodityId, uint256 price) internal view returns (uint256) {
        return (price * eventModifier[commodityId]) / BASIS_POINTS;
    }
    
    /**
     * @dev Record price to history (call periodically)
     */
    function recordPriceHistory() external {
        for (uint256 i = 0; i < NUM_COMMODITIES; i++) {
            _recordPrice(i);
        }
    }
    
    function _recordPrice(uint256 commodityId) internal {
        PricePoint[] storage history = priceHistory[commodityId];
        
        if (history.length >= MAX_HISTORY) {
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
