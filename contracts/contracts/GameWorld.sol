// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PriceOracle.sol";
import "./MerchantNFT.sol";

/**
 * @title GameWorld - Enhanced with Anti-Frontrunning & Gold Sinks
 * @dev Main game contract with travel time, warehouse fees, and dynamic economy
 * 
 * SOLUTIONS IMPLEMENTED:
 * 1. Travel Time - Prevents instant arbitrage (anti-frontrunning)
 * 2. Gold Sinks - Prevents hyperinflation
 * 3. Warehouse Capacity - Creates strategic decisions
 * 4. City-based Events - Enhances gameplay variety
 */
contract GameWorld is Ownable {
    
    // ============ CONTRACT REFERENCES ============
    PriceOracle public priceOracle;
    MerchantNFT public merchantNFT;
    
    // ============ CONSTANTS ============
    uint256 public constant NUM_COMMODITIES = 5;
    uint256 public constant BASIS_POINTS = 10000;
    
    // ============ CITY DATA ============
    struct City {
        string name;
        string description;
        uint256 travelCost;           // Base gold cost
        uint256[] supplyBonus;        // Price modifier when buying
        uint256[] demandBonus;        // Price modifier when selling
        uint256 warehouseCapacity;    // Max items stored
        uint256 warehouseFeePerDay;   // Daily storage fee (gold sink!)
        bool isActive;
    }
    
    mapping(uint256 => City) public cities;
    uint256 public cityCount;
    
    // ============ TRAVEL TIME SYSTEM (Anti-Frontrunning) ============
    
    struct TravelStatus {
        bool isTraveling;
        uint256 fromCity;
        uint256 toCity;
        uint256 departureTime;
        uint256 arrivalTime;
    }
    
    // Travel times between cities (in seconds)
    // travelTimes[fromCity][toCity] = seconds
    mapping(uint256 => mapping(uint256 => uint256)) public travelTimes;
    
    // Player travel status
    mapping(uint256 => TravelStatus) public merchantTravel;
    
    // ============ INVENTORY SYSTEM ============
    
    struct Inventory {
        uint256[] quantities;
        uint256[] purchasePrices;  // For P&L calculation
        uint256 lastWarehouseFee;  // Timestamp of last fee deduction
    }
    
    mapping(uint256 => Inventory) public inventories;
    
    // ============ GOLD SINKS ============
    
    uint256 public tradeTaxRate = 200;           // 2% tax on all trades
    uint256 public storageFeePer100Items = 5;   // 5 gold per 100 items per day
    uint256 public shipRepairCostPerTrip = 10;   // Random chance of ship damage
    
    // Treasury collects taxes (could be used for rewards later)
    uint256 public treasury;
    
    // ============ EVENTS ============
    
    event CityCreated(uint256 indexed cityId, string name);
    event TravelStarted(uint256 indexed merchantId, uint256 fromCity, uint256 toCity, uint256 arrivalTime);
    event TravelCompleted(uint256 indexed merchantId, uint256 fromCity, uint256 toCity);
    event TradeExecuted(
        uint256 indexed merchantId, 
        uint256 cityId, 
        uint256 commodityId, 
        bool isBuy, 
        uint256 quantity, 
        uint256 price,
        uint256 taxPaid
    );
    event WarehouseFeeCharged(uint256 indexed merchantId, uint256 amount);
    event ShipDamaged(uint256 indexed merchantId, uint256 repairCost);
    event AchievementUnlocked(uint256 indexed merchantId, string achievementId);
    
    // Achievement tracking
    mapping(uint256 => mapping(string => bool)) public achievements;
    
    // Visited cities tracking (for explorer achievements)
    mapping(uint256 => mapping(uint256 => bool)) public visitedCities;
    
    // ============ CONSTRUCTOR ============
    
    constructor(address _priceOracle, address _merchantNFT) Ownable(msg.sender) {
        priceOracle = PriceOracle(_priceOracle);
        merchantNFT = MerchantNFT(_merchantNFT);
        
        _initializeCities();
        _initializeTravelTimes();
    }
    
    // ============ CITY INITIALIZATION ============
    
    function _initializeCities() internal {
        // City 0: Silverport - Trade hub, balanced, starting city
        uint256[] memory silverportSupply = new uint256[](5);
        uint256[] memory silverportDemand = new uint256[](5);
        for (uint256 i = 0; i < 5; i++) {
            silverportSupply[i] = 10000;
            silverportDemand[i] = 10000;
        }
        _createCity(
            "Silverport", 
            "A bustling trade hub where merchants from all lands gather.", 
            0,             // Free travel (starting city)
            silverportSupply, 
            silverportDemand,
            500,           // Large warehouse
            2              // Low storage fee
        );
        
        // City 1: Goldmere - Mountain mining city
        uint256[] memory goldmereSupply = new uint256[](5);
        uint256[] memory goldmereDemand = new uint256[](5);
        goldmereSupply[0] = 7500;   // Gold VERY cheap (mine here!)
        goldmereSupply[1] = 13000;  // Wheat expensive (hard to farm)
        goldmereSupply[2] = 10000;
        goldmereSupply[3] = 11000;
        goldmereSupply[4] = 8500;   // Iron cheap (mines)
        goldmereDemand[0] = 8500;
        goldmereDemand[1] = 14000;  // NEED wheat badly
        goldmereDemand[2] = 10000;
        goldmereDemand[3] = 10500;
        goldmereDemand[4] = 9000;
        _createCity(
            "Goldmere", 
            "Mountain city rich in precious metals. The dwarves mine day and night.", 
            60,
            goldmereSupply, 
            goldmereDemand,
            300,           // Smaller warehouse (cave storage)
            5              // Higher fee (cold storage)
        );
        
        // City 2: Silkwind - Eastern exotic city
        uint256[] memory silkwindSupply = new uint256[](5);
        uint256[] memory silkwindDemand = new uint256[](5);
        silkwindSupply[0] = 11500;  // Gold expensive
        silkwindSupply[1] = 10000;
        silkwindSupply[2] = 7000;   // Silk VERY cheap (produced here)
        silkwindSupply[3] = 7500;   // Spices cheap (trade routes)
        silkwindSupply[4] = 14000;  // Iron expensive (no mines)
        silkwindDemand[0] = 12500;  // Want gold (luxury market)
        silkwindDemand[1] = 10000;
        silkwindDemand[2] = 7500;
        silkwindDemand[3] = 8000;
        silkwindDemand[4] = 15000;  // NEED iron badly
        _createCity(
            "Silkwind", 
            "Eastern city of silk weavers and spice merchants. Cherry blossoms line the streets.", 
            80,            // Far travel
            silkwindSupply, 
            silkwindDemand,
            400,
            3
        );
        
        // City 3: Ironhold - Industrial fortress
        uint256[] memory ironholdSupply = new uint256[](5);
        uint256[] memory ironholdDemand = new uint256[](5);
        ironholdSupply[0] = 12500;  // Gold expensive
        ironholdSupply[1] = 8000;   // Wheat cheap (fertile plains)
        ironholdSupply[2] = 14000;  // Silk expensive
        ironholdSupply[3] = 13000;  // Spices expensive
        ironholdSupply[4] = 6500;   // Iron VERY cheap (forges!)
        ironholdDemand[0] = 11500;
        ironholdDemand[1] = 8500;
        ironholdDemand[2] = 15000;  // WANT silk (uniforms)
        ironholdDemand[3] = 14000;  // WANT spices (food)
        ironholdDemand[4] = 7000;
        _createCity(
            "Ironhold", 
            "A fortress city of blacksmiths and soldiers. Smoke rises from countless forges.", 
            70,
            ironholdSupply, 
            ironholdDemand,
            600,           // Large military warehouses
            4
        );
    }
    
    function _initializeTravelTimes() internal {
        // Travel times in seconds (use shorter for demo, longer for production)
        // These times PREVENT instant arbitrage!
        
        // From Silverport (0)
        travelTimes[0][1] = 30;   // To Goldmere: 30 seconds
        travelTimes[0][2] = 45;   // To Silkwind: 45 seconds (far east)
        travelTimes[0][3] = 30;   // To Ironhold: 30 seconds
        
        // From Goldmere (1)
        travelTimes[1][0] = 30;
        travelTimes[1][2] = 60;   // Mountain to East: longest route
        travelTimes[1][3] = 40;
        
        // From Silkwind (2)
        travelTimes[2][0] = 45;
        travelTimes[2][1] = 60;
        travelTimes[2][3] = 50;
        
        // From Ironhold (3)
        travelTimes[3][0] = 30;
        travelTimes[3][1] = 40;
        travelTimes[3][2] = 50;
    }
    
    function _createCity(
        string memory name,
        string memory description,
        uint256 travelCost,
        uint256[] memory supplyBonus,
        uint256[] memory demandBonus,
        uint256 warehouseCapacity,
        uint256 warehouseFee
    ) internal {
        cities[cityCount] = City({
            name: name,
            description: description,
            travelCost: travelCost,
            supplyBonus: supplyBonus,
            demandBonus: demandBonus,
            warehouseCapacity: warehouseCapacity,
            warehouseFeePerDay: warehouseFee,
            isActive: true
        });
        
        emit CityCreated(cityCount, name);
        cityCount++;
    }
    
    // ============ TRAVEL SYSTEM (Anti-Frontrunning!) ============
    
    /**
     * @dev Start travel to a city (NOT instant!)
     * Player cannot trade while traveling
     */
    function startTravel(uint256 toCity) external {
        require(toCity < cityCount, "Invalid city");
        require(cities[toCity].isActive, "City not active");
        
        uint256 merchantId = merchantNFT.playerMerchant(msg.sender);
        require(merchantId != 0, "No merchant");
        require(!merchantTravel[merchantId].isTraveling, "Already traveling");
        
        MerchantNFT.Merchant memory merchant = merchantNFT.getMerchant(merchantId);
        require(merchant.currentCity != toCity, "Already in this city");
        
        uint256 travelCost = cities[toCity].travelCost;
        require(merchant.gold >= travelCost, "Not enough gold for travel");
        
        // Calculate travel time
        uint256 travelTime = travelTimes[merchant.currentCity][toCity];
        require(travelTime > 0, "No route available");
        
        // Deduct travel cost (Gold Sink #1)
        merchantNFT.updateGold(merchantId, merchant.gold - travelCost);
        treasury += travelCost / 2; // Half goes to treasury
        
        // Random ship damage chance (Gold Sink #2) - simplified for hackathon
        // In production: use Chainlink VRF
        if (block.timestamp % 5 == 0) {
            uint256 repairCost = shipRepairCostPerTrip;
            if (merchant.gold >= repairCost + travelCost) {
                merchantNFT.updateGold(merchantId, merchant.gold - travelCost - repairCost);
                emit ShipDamaged(merchantId, repairCost);
            }
        }
        
        // Set travel status
        merchantTravel[merchantId] = TravelStatus({
            isTraveling: true,
            fromCity: merchant.currentCity,
            toCity: toCity,
            departureTime: block.timestamp,
            arrivalTime: block.timestamp + travelTime
        });
        
        emit TravelStarted(merchantId, merchant.currentCity, toCity, block.timestamp + travelTime);
    }
    
    /**
     * @dev Complete travel (must call after arrival time)
     */
    function completeTravel() external {
        uint256 merchantId = merchantNFT.playerMerchant(msg.sender);
        require(merchantId != 0, "No merchant");
        
        TravelStatus storage travel = merchantTravel[merchantId];
        require(travel.isTraveling, "Not traveling");
        require(block.timestamp >= travel.arrivalTime, "Still traveling");
        
        // Update merchant location
        merchantNFT.updateCity(merchantId, travel.toCity);
        
        // Mark city as visited
        visitedCities[merchantId][travel.toCity] = true;
        
        // Clear travel status
        uint256 fromCity = travel.fromCity;
        uint256 toCity = travel.toCity;
        travel.isTraveling = false;
        
        // Award XP
        merchantNFT.addExperience(merchantId, 5);
        
        emit TravelCompleted(merchantId, fromCity, toCity);
        
        _checkTravelAchievements(merchantId);
    }
    
    /**
     * @dev Check if merchant can trade (not traveling)
     */
    function canTrade(uint256 merchantId) public view returns (bool) {
        return !merchantTravel[merchantId].isTraveling;
    }
    
    /**
     * @dev Get travel status
     */
    function getTravelStatus(uint256 merchantId) external view returns (
        bool isTraveling,
        uint256 fromCity,
        uint256 toCity,
        uint256 timeRemaining
    ) {
        TravelStatus storage travel = merchantTravel[merchantId];
        
        uint256 remaining = 0;
        if (travel.isTraveling && block.timestamp < travel.arrivalTime) {
            remaining = travel.arrivalTime - block.timestamp;
        }
        
        return (
            travel.isTraveling,
            travel.fromCity,
            travel.toCity,
            remaining
        );
    }
    
    // ============ PRICING ============
    
    function getCityPrice(uint256 cityId, uint256 commodityId, bool isBuying) 
        public 
        view 
        returns (uint256) 
    {
        require(cityId < cityCount, "Invalid city");
        require(commodityId < NUM_COMMODITIES, "Invalid commodity");
        
        uint256 basePrice = priceOracle.getPrice(commodityId);
        City storage city = cities[cityId];
        
        if (isBuying) {
            return (basePrice * city.supplyBonus[commodityId]) / BASIS_POINTS;
        } else {
            return (basePrice * city.demandBonus[commodityId]) / BASIS_POINTS;
        }
    }
    
    function getAllCityPrices(uint256 cityId) 
        external 
        view 
        returns (uint256[] memory buyPrices, uint256[] memory sellPrices) 
    {
        require(cityId < cityCount, "Invalid city");
        
        buyPrices = new uint256[](NUM_COMMODITIES);
        sellPrices = new uint256[](NUM_COMMODITIES);
        
        for (uint256 i = 0; i < NUM_COMMODITIES; i++) {
            buyPrices[i] = getCityPrice(cityId, i, true);
            sellPrices[i] = getCityPrice(cityId, i, false);
        }
    }
    
    // ============ TRADING (with taxes!) ============
    
    /**
     * @dev Buy commodities (with tax - Gold Sink #3)
     */
    function buy(uint256 commodityId, uint256 quantity) external {
        require(commodityId < NUM_COMMODITIES, "Invalid commodity");
        require(quantity > 0, "Quantity must be > 0");
        
        uint256 merchantId = merchantNFT.playerMerchant(msg.sender);
        require(merchantId != 0, "No merchant");
        require(canTrade(merchantId), "Cannot trade while traveling");
        
        // Charge warehouse fees first (Gold Sink #4)
        _chargeWarehouseFees(merchantId);
        
        MerchantNFT.Merchant memory merchant = merchantNFT.getMerchant(merchantId);
        
        uint256 pricePerUnit = getCityPrice(merchant.currentCity, commodityId, true);
        uint256 subtotal = pricePerUnit * quantity;
        uint256 tax = (subtotal * tradeTaxRate) / BASIS_POINTS;
        uint256 totalCost = subtotal + tax;
        
        require(merchant.gold >= totalCost, "Not enough gold");
        
        // Check warehouse capacity
        _ensureInventory(merchantId);
        Inventory storage inv = inventories[merchantId];
        uint256 totalItems = _getTotalInventory(merchantId);
        require(
            totalItems + quantity <= cities[merchant.currentCity].warehouseCapacity,
            "Warehouse full"
        );
        
        // Update inventory with average price
        uint256 existingQty = inv.quantities[commodityId];
        uint256 existingValue = existingQty * inv.purchasePrices[commodityId];
        uint256 newValue = existingValue + subtotal;
        uint256 newQty = existingQty + quantity;
        inv.purchasePrices[commodityId] = newValue / newQty;
        inv.quantities[commodityId] = newQty;
        
        // Deduct gold
        merchantNFT.updateGold(merchantId, merchant.gold - totalCost);
        
        // Tax goes to treasury
        treasury += tax;
        
        // Award XP
        merchantNFT.addExperience(merchantId, 2);
        
        emit TradeExecuted(merchantId, merchant.currentCity, commodityId, true, quantity, pricePerUnit, tax);
        
        _checkTradeAchievements(merchantId);
    }
    
    /**
     * @dev Sell commodities (with tax - Gold Sink #3)
     */
    function sell(uint256 commodityId, uint256 quantity) external {
        require(commodityId < NUM_COMMODITIES, "Invalid commodity");
        require(quantity > 0, "Quantity must be > 0");
        
        uint256 merchantId = merchantNFT.playerMerchant(msg.sender);
        require(merchantId != 0, "No merchant");
        require(canTrade(merchantId), "Cannot trade while traveling");
        
        // Charge warehouse fees first
        _chargeWarehouseFees(merchantId);
        
        _ensureInventory(merchantId);
        Inventory storage inv = inventories[merchantId];
        require(inv.quantities[commodityId] >= quantity, "Not enough inventory");
        
        MerchantNFT.Merchant memory merchant = merchantNFT.getMerchant(merchantId);
        
        uint256 pricePerUnit = getCityPrice(merchant.currentCity, commodityId, false);
        uint256 subtotal = pricePerUnit * quantity;
        uint256 tax = (subtotal * tradeTaxRate) / BASIS_POINTS;
        uint256 netRevenue = subtotal - tax;
        
        // Calculate profit (before tax, for stats)
        uint256 costBasis = inv.purchasePrices[commodityId] * quantity;
        int256 profit = int256(subtotal) - int256(costBasis);
        
        // Update inventory
        inv.quantities[commodityId] -= quantity;
        
        // Add gold (after tax)
        merchantNFT.updateGold(merchantId, merchant.gold + netRevenue);
        
        // Tax goes to treasury
        treasury += tax;
        
        // Record trade
        merchantNFT.recordTrade(merchantId, profit);
        
        // Award XP (more for profit)
        uint256 xp = profit > 0 ? 10 : 3;
        merchantNFT.addExperience(merchantId, xp);
        
        emit TradeExecuted(merchantId, merchant.currentCity, commodityId, false, quantity, pricePerUnit, tax);
        
        _checkTradeAchievements(merchantId);
    }
    
    // ============ WAREHOUSE FEES (Gold Sink #4) ============
    
    function _chargeWarehouseFees(uint256 merchantId) internal {
        Inventory storage inv = inventories[merchantId];
        
        if (inv.quantities.length == 0) {
            inv.lastWarehouseFee = block.timestamp;
            return;
        }
        
        if (inv.lastWarehouseFee == 0) {
            inv.lastWarehouseFee = block.timestamp;
            return;
        }
        
        uint256 daysPassed = (block.timestamp - inv.lastWarehouseFee) / 1 days;
        if (daysPassed == 0) return;
        
        uint256 totalItems = _getTotalInventory(merchantId);
        if (totalItems == 0) {
            inv.lastWarehouseFee = block.timestamp;
            return;
        }
        
        // Fee: X gold per 100 items per day
        uint256 fee = (totalItems * storageFeePer100Items * daysPassed) / 100;
        
        if (fee > 0) {
            MerchantNFT.Merchant memory merchant = merchantNFT.getMerchant(merchantId);
            
            // Deduct fee (capped at current gold)
            uint256 actualFee = fee > merchant.gold ? merchant.gold : fee;
            if (actualFee > 0) {
                merchantNFT.updateGold(merchantId, merchant.gold - actualFee);
                treasury += actualFee;
                emit WarehouseFeeCharged(merchantId, actualFee);
            }
        }
        
        inv.lastWarehouseFee = block.timestamp;
    }
    
    function _getTotalInventory(uint256 merchantId) internal view returns (uint256) {
        Inventory storage inv = inventories[merchantId];
        if (inv.quantities.length == 0) return 0;
        
        uint256 total = 0;
        for (uint256 i = 0; i < NUM_COMMODITIES; i++) {
            total += inv.quantities[i];
        }
        return total;
    }
    
    // ============ INVENTORY HELPERS ============
    
    function _ensureInventory(uint256 merchantId) internal {
        if (inventories[merchantId].quantities.length == 0) {
            inventories[merchantId].quantities = new uint256[](NUM_COMMODITIES);
            inventories[merchantId].purchasePrices = new uint256[](NUM_COMMODITIES);
            inventories[merchantId].lastWarehouseFee = block.timestamp;
        }
    }
    
    function getInventory(address player) 
        external 
        view 
        returns (uint256[] memory quantities, uint256[] memory avgPrices) 
    {
        uint256 merchantId = merchantNFT.playerMerchant(player);
        require(merchantId != 0, "No merchant");
        
        Inventory storage inv = inventories[merchantId];
        
        if (inv.quantities.length == 0) {
            quantities = new uint256[](NUM_COMMODITIES);
            avgPrices = new uint256[](NUM_COMMODITIES);
        } else {
            quantities = inv.quantities;
            avgPrices = inv.purchasePrices;
        }
    }
    
    // ============ CITY INFO ============
    
    function getCity(uint256 cityId) 
        external 
        view 
        returns (
            string memory name,
            string memory description,
            uint256 travelCost,
            uint256 warehouseCapacity,
            uint256 warehouseFee,
            bool isActive
        ) 
    {
        require(cityId < cityCount, "Invalid city");
        City storage city = cities[cityId];
        return (
            city.name, 
            city.description, 
            city.travelCost, 
            city.warehouseCapacity,
            city.warehouseFeePerDay,
            city.isActive
        );
    }
    
    function getAllCities() 
        external 
        view 
        returns (string[] memory names, uint256[] memory travelCosts) 
    {
        names = new string[](cityCount);
        travelCosts = new uint256[](cityCount);
        
        for (uint256 i = 0; i < cityCount; i++) {
            names[i] = cities[i].name;
            travelCosts[i] = cities[i].travelCost;
        }
    }
    
    // ============ ACHIEVEMENTS ============
    
    function _checkTravelAchievements(uint256 merchantId) internal {
        // First travel
        if (!achievements[merchantId]["first_travel"]) {
            achievements[merchantId]["first_travel"] = true;
            emit AchievementUnlocked(merchantId, "first_travel");
        }
        
        // Explorer - visited all cities
        uint256 citiesVisited = 0;
        for (uint256 i = 0; i < cityCount; i++) {
            if (visitedCities[merchantId][i]) citiesVisited++;
        }
        
        if (!achievements[merchantId]["explorer"] && citiesVisited >= cityCount) {
            achievements[merchantId]["explorer"] = true;
            emit AchievementUnlocked(merchantId, "explorer");
        }
    }
    
    function _checkTradeAchievements(uint256 merchantId) internal {
        MerchantNFT.Merchant memory merchant = merchantNFT.getMerchant(merchantId);
        
        // First trade
        if (!achievements[merchantId]["first_trade"] && merchant.totalTrades >= 1) {
            achievements[merchantId]["first_trade"] = true;
            emit AchievementUnlocked(merchantId, "first_trade");
        }
        
        // Trader milestones
        if (!achievements[merchantId]["trader_10"] && merchant.totalTrades >= 10) {
            achievements[merchantId]["trader_10"] = true;
            emit AchievementUnlocked(merchantId, "trader_10");
        }
        
        if (!achievements[merchantId]["trader_50"] && merchant.totalTrades >= 50) {
            achievements[merchantId]["trader_50"] = true;
            emit AchievementUnlocked(merchantId, "trader_50");
        }
        
        // Profit milestones
        if (!achievements[merchantId]["profit_1000"] && merchant.totalProfit >= 1000) {
            achievements[merchantId]["profit_1000"] = true;
            emit AchievementUnlocked(merchantId, "profit_1000");
        }
        
        if (!achievements[merchantId]["profit_10000"] && merchant.totalProfit >= 10000) {
            achievements[merchantId]["profit_10000"] = true;
            emit AchievementUnlocked(merchantId, "profit_10000");
        }
    }
    
    function hasAchievement(uint256 merchantId, string calldata achievementId) 
        external 
        view 
        returns (bool) 
    {
        return achievements[merchantId][achievementId];
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    function setTradeTaxRate(uint256 newRate) external onlyOwner {
        require(newRate <= 1000, "Max 10% tax");
        tradeTaxRate = newRate;
    }
    
    function setTravelTime(uint256 fromCity, uint256 toCity, uint256 time) external onlyOwner {
        require(fromCity < cityCount && toCity < cityCount, "Invalid cities");
        travelTimes[fromCity][toCity] = time;
    }
    
    function withdrawTreasury(address to, uint256 amount) external onlyOwner {
        require(amount <= treasury, "Not enough in treasury");
        treasury -= amount;
        // In production: would transfer actual tokens
    }
}
