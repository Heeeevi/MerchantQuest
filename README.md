# MerchantQuest 🎮⚔️

> **"Where Fantasy Trading Meets Real Markets"**

A medieval trading RPG where in-game commodity prices mirror real-world markets through blockchain oracles. Learn to trade, manage risk, and think like a merchant - all while having fun!

🌐 **Live Demo:** [Coming Soon - Netlify]  
📜 **Contracts:** [Mantle Sepolia Explorer](https://sepolia.mantlescan.xyz)

## 📍 Deployed Contracts (Mantle Sepolia)

| Contract | Address |
|----------|---------|
| PriceOracleV2 (Pyth) | `0xf8273354D96b5852a86c8E1EBe7dF2bDbcaFEd1B` |
| MerchantNFT | `0xB8789618962E5F43865be8A6EE0b2e8c1CC5d738` |
| GameWorld | `0x123dCDD6AA44D14db9a2B1118F588286f9FC0d05` |

## 🎯 Problem We're Solving

**The Financial Literacy Crisis:**
- Only 33% of adults worldwide are financially literate (S&P Global)
- 76% of Gen Z feel they lack financial education (TIAA Institute)
- 60% of millennials don't understand basic investing

**Our Solution:**
Gamified financial education through an engaging medieval trading RPG where players learn real market dynamics by playing.

## 🎮 Gameplay

### Core Loop
```
BUY → TRAVEL → SELL → PROFIT → REPEAT
```

1. **Buy Goods** - Purchase commodities at market prices
2. **Travel** - Move between cities (each has different supply/demand)
3. **Sell** - Sell your goods for profit
4. **Level Up** - Earn XP, unlock achievements, climb leaderboard

### RWA Integration
- Commodity prices in-game reflect REAL market data via oracles
- Gold, Wheat, Silk, Spices prices move with actual markets
- Players learn to read market trends through gameplay

## 🏗️ Tech Stack

- **Blockchain:** Mantle Network (Sepolia Testnet)
- **Smart Contracts:** Solidity + Hardhat
- **Frontend:** Next.js 14 + TypeScript
- **Styling:** TailwindCSS
- **Web3:** wagmi + viem
- **Oracle:** Chainlink Price Feeds (simulated for hackathon)

## 📁 Project Structure

```
MerchantQuest/
├── contracts/           # Solidity smart contracts
│   ├── MerchantNFT.sol
│   ├── GameWorld.sol
│   ├── Marketplace.sol
│   └── PriceOracle.sol
├── frontend/            # Next.js application
│   ├── app/
│   ├── components/
│   └── lib/
├── scripts/             # Deployment scripts
└── test/                # Contract tests
```

## 🚀 Quick Start

```bash
# Install dependencies
cd contracts && npm install
cd ../frontend && npm install

# Deploy contracts (Mantle Sepolia)
cd contracts && npx hardhat run scripts/deploy.js --network mantleSepolia

# Run frontend
cd frontend && npm run dev
```

## � How to Play

### Getting Started
1. **Connect Wallet** - Click "Connect Wallet" and connect with MetaMask
2. **Get Testnet MNT** - Visit [Mantle Sepolia Faucet](https://faucet.sepolia.mantle.xyz) for free test tokens
3. **Create Merchant** - Enter your merchant name to mint your character NFT
4. **Start Trading!** - You begin in Silverport with 1000 gold

### Trading Strategy
```
💡 BUY LOW → TRAVEL → SELL HIGH → PROFIT!
```

| City | Specialty | Strategy |
|------|-----------|----------|
| 🏛️ Silverport | Balanced prices | Good starting point |
| ⛰️ Goldmere | Cheap Gold & Iron | Buy metals here |
| 🏯 Silkwind | Cheap Silk & Spices | Buy luxuries here |
| 🏰 Ironhold | Cheap Iron & Wheat | Buy basics here |

### Tips for Beginners
- ⚔️ **Check prices** before buying - each city has different rates
- 🗺️ **Travel costs gold** - plan your route wisely
- 📈 **Watch for events** - Dragon attacks, harvests affect prices!
- 🏆 **Complete quests** - Earn bonus XP and achievements

### Achievements
| Badge | Name | How to Unlock |
|-------|------|---------------|
| 📜 | First Trade | Complete your first trade |
| 🗺️ | Wanderer | Travel to a new city |
| ⚖️ | Seasoned Trader | Complete 10 trades |
| 💰 | Profit Master | Earn 1000 gold profit |

## 🔮 Oracle System

The PriceOracleV2 integrates with **Pyth Network** for real-time market data!

### Real Data Integration
| Game Commodity | Real-World Price Feed | Source |
|----------------|----------------------|--------|
| 🪙 Gold | XAU/USD | Real gold spot price |
| 🌾 Wheat | ETH/USD proxy | Scaled crypto price |
| 🧵 Silk | ETH/USD proxy | Luxury goods proxy |
| 🌶️ Spices | XAG/USD | Silver as historical proxy |
| ⚔️ Iron | WTI/USD | Oil as industrial proxy |

### How It Works
```
Final Price = Base × (1 + AmplifiedDelta) × EventModifier

Where:
- Base = Starting game price (Gold=100, Wheat=10, etc.)
- AmplifiedDelta = Real market move × 3 (Chaos Multiplier)
- EventModifier = Game events (dragon attacks, harvests)
```

**Example:** If real gold (XAU) moves +2%, game Gold price moves +6%!

### Pyth Network Info
- **Mantle Sepolia:** `0x98046Bd286715D3B0BC227Dd7a956b83D8978603`
- Prices update in real-time from decentralized oracle
- Fallback mode available if Pyth data is stale

### Update Oracle (Admin Only)
```bash
# Normal market fluctuation
npx hardhat run scripts/updateOracle.js --network mantleSepolia

# Trigger a game event (PowerShell)
$env:EVENT="dragon"; npx hardhat run scripts/updateOracle.js --network mantleSepolia
$env:EVENT="bountifulHarvest"; npx hardhat run scripts/updateOracle.js --network mantleSepolia
$env:EVENT="goldDiscovery"; npx hardhat run scripts/updateOracle.js --network mantleSepolia
$env:EVENT="pirateRaid"; npx hardhat run scripts/updateOracle.js --network mantleSepolia
$env:EVENT="reset"; npx hardhat run scripts/updateOracle.js --network mantleSepolia

# Market scenarios (PowerShell)
$env:SCENARIO="bull"; npx hardhat run scripts/updateOracle.js --network mantleSepolia
$env:SCENARIO="bear"; npx hardhat run scripts/updateOracle.js --network mantleSepolia

# Linux/Mac
EVENT=dragon npx hardhat run scripts/updateOracle.js --network mantleSepolia
SCENARIO=bull npx hardhat run scripts/updateOracle.js --network mantleSepolia
```

## 🌐 Deploy to Netlify

### Environment Variables (Required)
Add these in Netlify Dashboard → Site Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_PRICE_ORACLE_ADDRESS` | `0xf8273354D96b5852a86c8E1EBe7dF2bDbcaFEd1B` |
| `NEXT_PUBLIC_MERCHANT_NFT_ADDRESS` | `0xB8789618962E5F43865be8A6EE0b2e8c1CC5d738` |
| `NEXT_PUBLIC_GAME_WORLD_ADDRESS` | `0x123dCDD6AA44D14db9a2B1118F588286f9FC0d05` |
| `NEXT_PUBLIC_CHAIN_ID` | `5003` |
| `NEXT_PUBLIC_CHAIN_NAME` | `Mantle Sepolia` |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Get from [cloud.walletconnect.com](https://cloud.walletconnect.com) |

### Build Settings
- **Base directory:** `frontend`
- **Build command:** `npm run build`
- **Publish directory:** `frontend/.next`

> ⚠️ **Important:** You MUST get a WalletConnect Project ID (free) for wallet connections to work!

## �🎖️ Features

- **4 Trading Cities** - Each with unique supply/demand
- **5 Commodities** - Gold, Wheat, Silk, Spices, Iron
- **Merchant NFT** - Your on-chain character
- **Real Price Oracle** - Prices reflect real markets
- **Leaderboard** - Compete with other traders
- **Achievements** - Unlock badges for milestones

## 🌙 Halal Compliance

✅ No gambling mechanics
✅ No interest/riba
✅ Skill-based outcomes
✅ Educational purpose
✅ Trading simulation (Ijarah-compliant)

## 📜 License

MIT License

## 🏆 Built for Mantle Global Hackathon 2025

Track: GameFi & Social
