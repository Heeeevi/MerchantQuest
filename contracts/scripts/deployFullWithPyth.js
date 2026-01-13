const hre = require("hardhat");

/**
 * Full System Deployment with PriceOracleV2 (Pyth Integration)
 * 
 * Deploys:
 * 1. PriceOracleV2 (with Pyth Network integration)
 * 2. MerchantNFT
 * 3. GameWorld (connected to PriceOracleV2)
 */

const PYTH_ADDRESSES = {
  mantleSepolia: "0x98046Bd286715D3B0BC227Dd7a956b83D8978603",
  mantleMainnet: "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729",
  hardhat: "0x98046Bd286715D3B0BC227Dd7a956b83D8978603",
  localhost: "0x98046Bd286715D3B0BC227Dd7a956b83D8978603",
};

async function main() {
  console.log("🚀 Full MerchantQuest Deployment with Pyth Oracle");
  console.log("==================================================\n");

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

  // ============ DEPLOY CONTRACTS ============

  // 1. Deploy PriceOracleV2
  console.log("1️⃣  Deploying PriceOracleV2 (Pyth Integration)...");
  const PriceOracleV2 = await hre.ethers.getContractFactory("PriceOracleV2");
  const priceOracle = await PriceOracleV2.deploy(pythAddress);
  await priceOracle.waitForDeployment();
  const priceOracleAddress = await priceOracle.getAddress();
  console.log("   ✅ PriceOracleV2 deployed to:", priceOracleAddress);

  // 2. Deploy MerchantNFT
  console.log("\n2️⃣  Deploying MerchantNFT...");
  const MerchantNFT = await hre.ethers.getContractFactory("MerchantNFT");
  const merchantNFT = await MerchantNFT.deploy();
  await merchantNFT.waitForDeployment();
  const merchantNFTAddress = await merchantNFT.getAddress();
  console.log("   ✅ MerchantNFT deployed to:", merchantNFTAddress);

  // 3. Deploy GameWorld
  console.log("\n3️⃣  Deploying GameWorld...");
  const GameWorld = await hre.ethers.getContractFactory("GameWorld");
  const gameWorld = await GameWorld.deploy(priceOracleAddress, merchantNFTAddress);
  await gameWorld.waitForDeployment();
  const gameWorldAddress = await gameWorld.getAddress();
  console.log("   ✅ GameWorld deployed to:", gameWorldAddress);

  // 4. Configure permissions
  console.log("\n4️⃣  Configuring permissions...");
  const setGameTx = await merchantNFT.setGameContract(gameWorldAddress);
  await setGameTx.wait();
  console.log("   ✅ GameWorld authorized in MerchantNFT");

  // ============ TEST ORACLE ============
  
  console.log("\n5️⃣  Testing PriceOracleV2...");
  try {
    const prices = await priceOracle.getAllPrices();
    console.log("   📊 Current Prices:");
    const commodities = ["Gold", "Wheat", "Silk", "Spices", "Iron"];
    for (let i = 0; i < 5; i++) {
      console.log(`      ${commodities[i]}: ${prices[i]} gold`);
    }
    
    const breakdown = await priceOracle.getPriceBreakdown(0);
    console.log(`   🔄 Using Fallback: ${breakdown.usingFallback}`);
    
    if (!breakdown.usingFallback && breakdown.pythDelta !== 0n) {
      console.log(`   📈 Pyth Delta (Gold): ${breakdown.pythDelta.toString()} bp`);
    }
  } catch (error) {
    console.log("   ⚠️  Initial price fetch, using base prices");
  }

  // ============ SUMMARY ============

  console.log("\n==================================================");
  console.log("🎉 Full Deployment Complete!\n");
  console.log("Contract Addresses:");
  console.log("-------------------");
  console.log("PriceOracleV2:", priceOracleAddress);
  console.log("MerchantNFT:  ", merchantNFTAddress);
  console.log("GameWorld:    ", gameWorldAddress);
  
  console.log("\n📝 Add these to your frontend .env.local:");
  console.log(`NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=${priceOracleAddress}`);
  console.log(`NEXT_PUBLIC_MERCHANT_NFT_ADDRESS=${merchantNFTAddress}`);
  console.log(`NEXT_PUBLIC_GAME_WORLD_ADDRESS=${gameWorldAddress}`);
  
  console.log("\n🔗 Real Oracle Integration:");
  console.log("   - Pyth Network: " + pythAddress);
  console.log("   - Gold ← XAU/USD (real gold spot price)");
  console.log("   - Wheat ← ETH/USD proxy");
  console.log("   - Silk ← ETH/USD proxy");
  console.log("   - Spices ← XAG/USD (silver as proxy)");
  console.log("   - Iron ← WTI/USD (oil as proxy)");
  console.log("   - Volatility Amplifier: 3x (real moves amplified)");
  
  console.log("\n💡 Oracle Management:");
  console.log("   - setFallbackMode(true) → Use static prices");
  console.log("   - updateReferencePrices() → Reset baseline");
  console.log("   - setVolatilityAmplifier(n) → Change amplification");

  // ============ VERIFY ============

  if (network !== "hardhat" && network !== "localhost") {
    console.log("\n🔍 Waiting for block confirmations...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    try {
      console.log("\nVerifying contracts...");
      
      await hre.run("verify:verify", {
        address: priceOracleAddress,
        constructorArguments: [pythAddress],
      }).catch(e => console.log("PriceOracleV2 verify:", e.message));
      
      await hre.run("verify:verify", {
        address: merchantNFTAddress,
        constructorArguments: [],
      }).catch(e => console.log("MerchantNFT verify:", e.message));
      
      await hre.run("verify:verify", {
        address: gameWorldAddress,
        constructorArguments: [priceOracleAddress, merchantNFTAddress],
      }).catch(e => console.log("GameWorld verify:", e.message));
      
    } catch (error) {
      console.log("⚠️  Verification issues:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
