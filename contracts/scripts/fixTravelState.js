// Script to fix stuck travel state for a player
const hre = require("hardhat");

async function main() {
  const playerAddress = "0x70D0D4378dAA33cc453666931a74C75e355c478e";
  const gameWorldAddress = "0xe68b0859542A9177543b4741757EFb7638De3E17";

  console.log("=".repeat(60));
  console.log("🔧 MerchantQuest - Fix Travel State Tool");
  console.log("=".repeat(60));
  console.log(`\n📍 Player Address: ${playerAddress}`);
  console.log(`📍 GameWorld Contract: ${gameWorldAddress}\n`);

  // Get contract instance
  const GameWorld = await hre.ethers.getContractFactory("GameWorld");
  const gameWorld = GameWorld.attach(gameWorldAddress);

  // Check current travel info
  console.log("📊 Checking travel status...");
  try {
    const travelInfo = await gameWorld.getTravelInfo(playerAddress);
    console.log("\n🚶 Travel Info:");
    console.log(`   - Is Traveling: ${travelInfo.isTraveling}`);
    console.log(`   - Destination City: ${travelInfo.destination}`);
    console.log(`   - Arrival Time: ${travelInfo.arrivalTime}`);
    
    if (travelInfo.isTraveling) {
      const now = Math.floor(Date.now() / 1000);
      const arrivalTime = Number(travelInfo.arrivalTime);
      
      if (now >= arrivalTime) {
        console.log(`\n✅ Travel time has passed! (Current: ${now}, Arrival: ${arrivalTime})`);
        console.log("   You can call completeTravel() to finish the journey.\n");
      } else {
        const remaining = arrivalTime - now;
        console.log(`\n⏳ Still traveling! ${remaining} seconds remaining.`);
        console.log(`   Wait ${remaining} seconds, then call completeTravel().\n`);
      }
    } else {
      console.log("\n✅ Player is NOT currently traveling. No fix needed!");
    }
  } catch (error) {
    console.error("❌ Error checking travel info:", error.message);
  }

  // Try to complete travel if possible
  console.log("\n" + "=".repeat(60));
  console.log("🎯 To fix: Player needs to call completeTravel() from their wallet");
  console.log("=".repeat(60));
  console.log("\nOptions:");
  console.log("1. Use the frontend - it should auto-detect stuck travel");
  console.log("2. Call completeTravel() directly via Mantlescan");
  console.log("3. Use the game UI's 'Complete Travel' button");
  console.log("\n📝 Mantlescan Write Contract URL:");
  console.log(`   https://sepolia.mantlescan.xyz/address/${gameWorldAddress}#writeContract`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
