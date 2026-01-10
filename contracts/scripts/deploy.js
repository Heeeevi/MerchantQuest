const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying MerchantQuest contracts to", hre.network.name);
  console.log("================================================\n");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deployer:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "MNT\n");

  // Deploy PriceOracle
  console.log("1️⃣  Deploying PriceOracle...");
  const PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
  const priceOracle = await PriceOracle.deploy();
  await priceOracle.waitForDeployment();
  const priceOracleAddress = await priceOracle.getAddress();
  console.log("   ✅ PriceOracle deployed to:", priceOracleAddress);

  // Deploy MerchantNFT
  console.log("\n2️⃣  Deploying MerchantNFT...");
  const MerchantNFT = await hre.ethers.getContractFactory("MerchantNFT");
  const merchantNFT = await MerchantNFT.deploy();
  await merchantNFT.waitForDeployment();
  const merchantNFTAddress = await merchantNFT.getAddress();
  console.log("   ✅ MerchantNFT deployed to:", merchantNFTAddress);

  // Deploy GameWorld
  console.log("\n3️⃣  Deploying GameWorld...");
  const GameWorld = await hre.ethers.getContractFactory("GameWorld");
  const gameWorld = await GameWorld.deploy(priceOracleAddress, merchantNFTAddress);
  await gameWorld.waitForDeployment();
  const gameWorldAddress = await gameWorld.getAddress();
  console.log("   ✅ GameWorld deployed to:", gameWorldAddress);

  // Set GameWorld as authorized in MerchantNFT
  console.log("\n4️⃣  Configuring permissions...");
  const setGameTx = await merchantNFT.setGameContract(gameWorldAddress);
  await setGameTx.wait();
  console.log("   ✅ GameWorld authorized in MerchantNFT");

  // Summary
  console.log("\n================================================");
  console.log("🎉 Deployment Complete!\n");
  console.log("Contract Addresses:");
  console.log("-------------------");
  console.log("PriceOracle:  ", priceOracleAddress);
  console.log("MerchantNFT:  ", merchantNFTAddress);
  console.log("GameWorld:    ", gameWorldAddress);
  
  console.log("\n📝 Add these to your frontend .env.local:");
  console.log(`NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=${priceOracleAddress}`);
  console.log(`NEXT_PUBLIC_MERCHANT_NFT_ADDRESS=${merchantNFTAddress}`);
  console.log(`NEXT_PUBLIC_GAME_WORLD_ADDRESS=${gameWorldAddress}`);

  // Verify on explorer (optional)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 Waiting for block confirmations before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s
    
    try {
      console.log("\nVerifying PriceOracle...");
      await hre.run("verify:verify", {
        address: priceOracleAddress,
        constructorArguments: [],
      });
      
      console.log("Verifying MerchantNFT...");
      await hre.run("verify:verify", {
        address: merchantNFTAddress,
        constructorArguments: [],
      });
      
      console.log("Verifying GameWorld...");
      await hre.run("verify:verify", {
        address: gameWorldAddress,
        constructorArguments: [priceOracleAddress, merchantNFTAddress],
      });
      
      console.log("✅ All contracts verified!");
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
