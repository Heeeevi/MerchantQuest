// Contract ABIs for MerchantQuest

export const MERCHANT_NFT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" }
    ],
    "name": "createMerchant",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "player", "type": "address" }
    ],
    "name": "hasMerchant",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "player", "type": "address" }
    ],
    "name": "getMerchantByPlayer",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" },
      {
        "components": [
          { "internalType": "string", "name": "name", "type": "string" },
          { "internalType": "uint256", "name": "level", "type": "uint256" },
          { "internalType": "uint256", "name": "experience", "type": "uint256" },
          { "internalType": "uint256", "name": "gold", "type": "uint256" },
          { "internalType": "uint256", "name": "currentCity", "type": "uint256" },
          { "internalType": "uint256", "name": "totalTrades", "type": "uint256" },
          { "internalType": "uint256", "name": "totalProfit", "type": "uint256" },
          { "internalType": "uint256", "name": "createdAt", "type": "uint256" }
        ],
        "internalType": "struct MerchantNFT.Merchant",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "getMerchant",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "name", "type": "string" },
          { "internalType": "uint256", "name": "level", "type": "uint256" },
          { "internalType": "uint256", "name": "experience", "type": "uint256" },
          { "internalType": "uint256", "name": "gold", "type": "uint256" },
          { "internalType": "uint256", "name": "currentCity", "type": "uint256" },
          { "internalType": "uint256", "name": "totalTrades", "type": "uint256" },
          { "internalType": "uint256", "name": "totalProfit", "type": "uint256" },
          { "internalType": "uint256", "name": "createdAt", "type": "uint256" }
        ],
        "internalType": "struct MerchantNFT.Merchant",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "playerMerchant",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "experience", "type": "uint256" }
    ],
    "name": "calculateLevel",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "name", "type": "string" }
    ],
    "name": "MerchantCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "newLevel", "type": "uint256" }
    ],
    "name": "MerchantLevelUp",
    "type": "event"
  }
] as const;

export const PRICE_ORACLE_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "commodityId", "type": "uint256" }
    ],
    "name": "getPrice",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllPrices",
    "outputs": [
      { "internalType": "uint256[]", "name": "", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "commodityId", "type": "uint256" }
    ],
    "name": "getCommodityName",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "GOLD",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "WHEAT",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "SILK",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "SPICES",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "IRON",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "commodityId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "oldPrice", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "newPrice", "type": "uint256" }
    ],
    "name": "PriceUpdated",
    "type": "event"
  }
] as const;

export const GAME_WORLD_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_priceOracle", "type": "address" },
      { "internalType": "address", "name": "_merchantNFT", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "toCity", "type": "uint256" }
    ],
    "name": "startTravel",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "completeTravel",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "merchantId", "type": "uint256" }
    ],
    "name": "getTravelStatus",
    "outputs": [
      { "internalType": "bool", "name": "isTraveling", "type": "bool" },
      { "internalType": "uint256", "name": "fromCity", "type": "uint256" },
      { "internalType": "uint256", "name": "toCity", "type": "uint256" },
      { "internalType": "uint256", "name": "timeRemaining", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "merchantId", "type": "uint256" }
    ],
    "name": "canTrade",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "commodityId", "type": "uint256" },
      { "internalType": "uint256", "name": "quantity", "type": "uint256" }
    ],
    "name": "buy",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "commodityId", "type": "uint256" },
      { "internalType": "uint256", "name": "quantity", "type": "uint256" }
    ],
    "name": "sell",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "cityId", "type": "uint256" }
    ],
    "name": "getCity",
    "outputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "description", "type": "string" },
      { "internalType": "uint256", "name": "travelCost", "type": "uint256" },
      { "internalType": "bool", "name": "isActive", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllCities",
    "outputs": [
      { "internalType": "string[]", "name": "names", "type": "string[]" },
      { "internalType": "uint256[]", "name": "travelCosts", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "cityId", "type": "uint256" }
    ],
    "name": "getAllCityPrices",
    "outputs": [
      { "internalType": "uint256[]", "name": "buyPrices", "type": "uint256[]" },
      { "internalType": "uint256[]", "name": "sellPrices", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "cityId", "type": "uint256" },
      { "internalType": "uint256", "name": "commodityId", "type": "uint256" },
      { "internalType": "bool", "name": "isBuying", "type": "bool" }
    ],
    "name": "getCityPrice",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "player", "type": "address" }
    ],
    "name": "getInventory",
    "outputs": [
      { "internalType": "uint256[]", "name": "quantities", "type": "uint256[]" },
      { "internalType": "uint256[]", "name": "avgPrices", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "merchantId", "type": "uint256" },
      { "internalType": "string", "name": "achievementId", "type": "string" }
    ],
    "name": "hasAchievement",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "cityCount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "merchantId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "fromCity", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "toCity", "type": "uint256" }
    ],
    "name": "TravelCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "merchantId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "cityId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "commodityId", "type": "uint256" },
      { "indexed": false, "internalType": "bool", "name": "isBuy", "type": "bool" },
      { "indexed": false, "internalType": "uint256", "name": "quantity", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" }
    ],
    "name": "TradeExecuted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "merchantId", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "achievementId", "type": "string" }
    ],
    "name": "AchievementUnlocked",
    "type": "event"
  }
] as const;
