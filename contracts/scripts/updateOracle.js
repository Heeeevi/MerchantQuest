const hre = require("hardhat");

/**
 * Oracle Trend Updater Script
 * 
 * Updates commodity prices in the PriceOracle contract.
 * Run periodically or manually to simulate market movements.
 * 
 * Usage:
 *   npx hardhat run scripts/updateOracle.js --network mantleSepolia
 *   npx hardhat run scripts/updateOracle.js --network mantleSepolia -- --event dragon
 */

// Price Oracle address (update after deployment)
const PRICE_ORACLE_ADDRESS = "0xDed455727B2E4994a91787a311B21BCE5fF1019B";

// Commodity indices
const GOLD = 0;
const WHEAT = 1;
const SILK = 2;
const SPICES = 3;
const IRON = 4;

const COMMODITY_NAMES = ["Gold", "Wheat", "Silk", "Spices", "Iron"];

// Preset market scenarios
const MARKET_SCENARIOS = {
  // Normal market fluctuation (random ±10%)
  normal: () => {
    return COMMODITY_NAMES.map(() => {
      const change = Math.floor(Math.random() * 2000) - 1000; // -1000 to +1000 (±10%)
      return 10000 + change;
    });
  },
  
  // Bull market - everything up 5-15%
  bull: () => {
    return COMMODITY_NAMES.map(() => {
      const change = Math.floor(Math.random() * 1000) + 500; // +500 to +1500 (+5% to +15%)
      return 10000 + change;
    });
  },
  
  // Bear market - everything down 5-15%
  bear: () => {
    return COMMODITY_NAMES.map(() => {
      const change = Math.floor(Math.random() * 1000) + 500;
      return 10000 - change; // -5% to -15%
    });
  },
  
  // Gold rush - gold up, others normal
  goldRush: () => [15000, 10000, 10000, 10000, 10000],
  
  // Harvest season - wheat cheap
  harvest: () => [10000, 7500, 10000, 10000, 10000],
  
  // War time - iron expensive, silk cheap
  war: () => [11000, 12000, 8000, 10000, 15000],
  
  // Trade route disruption - spices and silk expensive
  tradeDisruption: () => [10000, 10000, 14000, 14000, 10000],
};

// Game events with modifiers
const GAME_EVENTS = {
  dragon: {
    name: "🐉 Dragon Attack!",
    description: "A dragon has attacked the trade routes! Luxury goods are scarce.",
    commodityIds: [SILK, SPICES],
    modifiers: [15000, 15000], // +50% price
  },
  
  bountifulHarvest: {
    name: "🌾 Bountiful Harvest",
    description: "Excellent weather has led to a record harvest. Wheat is abundant!",
    commodityIds: [WHEAT],
    modifiers: [7000], // -30% price
  },
  
  goldDiscovery: {
    name: "⛏️ Gold Vein Discovered",
    description: "Miners have discovered a massive gold vein in the mountains!",
    commodityIds: [GOLD],
    modifiers: [7500], // -25% price
  },
  
  pirateRaid: {
    name: "🏴‍☠️ Pirate Raid",
    description: "Pirates have raided coastal warehouses. Iron weapons are in high demand!",
    commodityIds: [IRON],
    modifiers: [14000], // +40% price
  },
  
  festival: {
    name: "🎉 Royal Festival",
    description: "The kingdom celebrates! Demand for luxuries has skyrocketed.",
    commodityIds: [GOLD, SILK, SPICES],
    modifiers: [12000, 13000, 12000],
  },
  
  reset: {
    name: "📊 Market Stabilization",
    description: "Markets have returned to normal conditions.",
    commodityIds: [GOLD, WHEAT, SILK, SPICES, IRON],
    modifiers: [10000, 10000, 10000, 10000, 10000],
  },
};

async function main() {
  console.log("🔮 MerchantQuest Oracle Updater");
  console.log("================================\n");

  // Parse from environment variables (set before running)
  // SCENARIO=bull npx hardhat run scripts/updateOracle.js --network mantleSepolia
  // EVENT=dragon npx hardhat run scripts/updateOracle.js --network mantleSepolia
  const scenario = process.env.SCENARIO || "normal";
  const eventName = process.env.EVENT || null;

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log("📍 Operator:", signer.address);

  // Get contract
  const priceOracle = await hre.ethers.getContractAt("PriceOracle", PRICE_ORACLE_ADDRESS, signer);
  
  // Show current prices
  console.log("\n📊 Current Prices:");
  const currentPrices = await priceOracle.getAllPrices();
  for (let i = 0; i < COMMODITY_NAMES.length; i++) {
    console.log(`   ${COMMODITY_NAMES[i]}: ${currentPrices[i]} gold`);
  }

  // Apply game event if specified
  if (eventName && GAME_EVENTS[eventName]) {
    const event = GAME_EVENTS[eventName];
    console.log(`\n🎮 Triggering Game Event: ${event.name}`);
    console.log(`   "${event.description}"`);
    
    const tx = await priceOracle.triggerGameEvent(
      event.name,
      event.description,
      event.commodityIds,
      event.modifiers
    );
    await tx.wait();
    console.log("   ✅ Event triggered!");
  }
  // Otherwise update market trends
  else {
    const scenarioFn = MARKET_SCENARIOS[scenario];
    if (!scenarioFn) {
      console.error(`❌ Unknown scenario: ${scenario}`);
      console.log("Available scenarios:", Object.keys(MARKET_SCENARIOS).join(", "));
      process.exit(1);
    }

    const newTrends = scenarioFn();
    console.log(`\n📈 Applying "${scenario}" market scenario:`);
    for (let i = 0; i < COMMODITY_NAMES.length; i++) {
      const change = ((newTrends[i] - 10000) / 100).toFixed(1);
      const sign = change >= 0 ? "+" : "";
      console.log(`   ${COMMODITY_NAMES[i]}: ${sign}${change}%`);
    }

    const tx = await priceOracle.updateOracleTrends(newTrends);
    await tx.wait();
    console.log("   ✅ Trends updated!");
  }

  // Show new prices
  console.log("\n📊 New Prices:");
  const newPrices = await priceOracle.getAllPrices();
  for (let i = 0; i < COMMODITY_NAMES.length; i++) {
    const diff = Number(newPrices[i]) - Number(currentPrices[i]);
    const sign = diff >= 0 ? "+" : "";
    console.log(`   ${COMMODITY_NAMES[i]}: ${newPrices[i]} gold (${sign}${diff})`);
  }

  console.log("\n✨ Done!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
