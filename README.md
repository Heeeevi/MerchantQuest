# MerchantQuest 🎮⚔️

> **"Where Fantasy Trading Meets Real Markets"**

A medieval trading RPG where in-game commodity prices mirror real-world markets through blockchain oracles. Learn to trade, manage risk, and think like a merchant - all while having fun!

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

## 🎖️ Features

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
