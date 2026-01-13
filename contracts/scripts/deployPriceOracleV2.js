const hre = require("hardhat");

/**
 * Deploy PriceOracleV2 with Pyth Network Integration
 * 
 * Pyth Network Addresses:
 * - Mantle Sepolia: 0x98046Bd286715D3B0BC227Dd7a956b83D8978603
 * - Mantle Mainnet: 0xA2aa501b19aff244D90cc15a4Cf739D2725B5729
 */

const PYTH_ADDRESSES = {
  mantleSepolia: "0x98046Bd286715D3B0BC227Dd7a956b83D8978603",
  mantleMainnet: "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729",
  hardhat: "0x98046Bd286715D3B0BC227Dd7a956b83D8978603", // Use Sepolia for local testing
  localhost: "0x98046Bd286715D3B0BC227Dd7a956b83D8978603",
};

async function main() {
  console.log("🚀 Deploying PriceOracleV2 with Pyth Integration");
  console.log("================================================\n");

  const network = hre.network.name;
  const pythAddress = PYTH_ADDRESSES[network];
  
  if (!pythAddress) {
    throw new Error(`No Pyth address configured for network: ${network}`);
  }

  console.log(`📡 Network: ${network}`);
  console.log(`🔮 Pyth Address: ${pythAddress}\n`);

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deployer:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "MNT\n");

  // Deploy PriceOracleV2
  console.log("1️⃣  Deploying PriceOracleV2...");
  const PriceOracleV2 = await hre.ethers.getContractFactory("PriceOracleV2");
  const priceOracleV2 = await PriceOracleV2.deploy(pythAddress);
  await priceOracleV2.waitForDeployment();
  const priceOracleV2Address = await priceOracleV2.getAddress();
  console.log("   ✅ PriceOracleV2 deployed to:", priceOracleV2Address);

  // Test the oracle
  console.log("\n2️⃣  Testing PriceOracleV2...");
  
  try {
    const prices = await priceOracleV2.getAllPrices();
    console.log("   📊 Current Prices:");
    const commodities = ["Gold", "Wheat", "Silk", "Spices", "Iron"];
    for (let i = 0; i < 5; i++) {
      console.log(`      ${commodities[i]}: ${prices[i]} gold`);
    }
    
    // Check if using fallback
    const breakdown = await priceOracleV2.getPriceBreakdown(0);
    console.log(`   🔄 Using Fallback: ${breakdown.usingFallback}`);
    
    if (!breakdown.usingFallback) {
      console.log(`   📈 Pyth Delta (Gold): ${breakdown.pythDelta.toString()} basis points`);
    }
  } catch (error) {
    console.log("   ⚠️  Price fetch failed (Pyth data may be stale on testnet)");
    console.log("   💡 Enabling fallback mode...");
    
    const tx = await priceOracleV2.setFallbackMode(true);
    await tx.wait();
    console.log("   ✅ Fallback mode enabled");
    
    const prices = await priceOracleV2.getAllPrices();
    console.log("   📊 Fallback Prices:");
    const commodities = ["Gold", "Wheat", "Silk", "Spices", "Iron"];
    for (let i = 0; i < 5; i++) {
      console.log(`      ${commodities[i]}: ${prices[i]} gold`);
    }
  }

  // Summary
  console.log("\n================================================");
  console.log("🎉 Deployment Complete!\n");
  console.log("Contract Address:");
  console.log("-------------------");
  console.log("PriceOracleV2:", priceOracleV2Address);
  
  console.log("\n📝 Update your frontend .env.local:");
  console.log(`NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=${priceOracleV2Address}`);
  
  console.log("\n🔗 Pyth Integration Info:");
  console.log("   - Pyth Contract:", pythAddress);
  console.log("   - Gold → XAU/USD (real gold price)");
  console.log("   - Wheat → ETH/USD proxy (scaled)");
  console.log("   - Silk → ETH/USD proxy");
  console.log("   - Spices → XAG/USD (silver as proxy)");
  console.log("   - Iron → WTI/USD (oil as proxy)");
  
  console.log("\n💡 Tips:");
  console.log("   - If Pyth data is stale, use setFallbackMode(true)");
  console.log("   - Call updateReferencePrices() to reset price baseline");
  console.log("   - Volatility amplifier is 3x by default (30000 basis points)");

  // Verify on explorer (optional)
  if (network !== "hardhat" && network !== "localhost") {
    console.log("\n🔍 Waiting for block confirmations before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    try {
      console.log("\nVerifying PriceOracleV2...");
      await hre.run("verify:verify", {
        address: priceOracleV2Address,
        constructorArguments: [pythAddress],
      });
      console.log("✅ Contract verified!");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
