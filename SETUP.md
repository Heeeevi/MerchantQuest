# 🚀 MerchantQuest - Setup & Run Guide

## Quick Start

### 1️⃣ Install Dependencies

```powershell
# Navigate to contracts folder
cd d:\Buildkathon\new mantle\MerchantQuest\contracts
npm install

# Navigate to frontend folder
cd d:\Buildkathon\new mantle\MerchantQuest\frontend
npm install
```

### 2️⃣ Configure Environment

**Contracts (.env):**
```powershell
cd d:\Buildkathon\new mantle\MerchantQuest\contracts
copy .env.example .env
# Edit .env and add your PRIVATE_KEY
```

**Frontend (.env.local):**
```powershell
cd d:\Buildkathon\new mantle\MerchantQuest\frontend
copy .env.example .env.local
# Update contract addresses after deployment
```

### 3️⃣ Deploy Smart Contracts

```powershell
cd d:\Buildkathon\new mantle\MerchantQuest\contracts

# Compile
npx hardhat compile

# Deploy to Mantle Sepolia
npx hardhat run scripts/deploy.js --network mantleSepolia
```

After deployment, copy the contract addresses to `frontend/.env.local`:
```
NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_MERCHANT_NFT_ADDRESS=0x...
NEXT_PUBLIC_GAME_WORLD_ADDRESS=0x...
```

### 4️⃣ Run Frontend

```powershell
cd d:\Buildkathon\new mantle\MerchantQuest\frontend
npm run dev
```

Open http://localhost:3000 in your browser!

---

## 🔧 Prerequisites

- Node.js 18+ 
- Git
- MetaMask or another Web3 wallet
- Mantle Sepolia testnet MNT (get from faucet)

### Get Test MNT:
- Mantle Sepolia Faucet: https://faucet.sepolia.mantle.xyz/

### Add Mantle Sepolia to MetaMask:
- Network Name: Mantle Sepolia
- RPC URL: https://rpc.sepolia.mantle.xyz
- Chain ID: 5003
- Symbol: MNT
- Explorer: https://sepolia.mantlescan.xyz

---

## 📁 Project Structure

```
MerchantQuest/
├── contracts/                 # Smart contracts (Hardhat)
│   ├── contracts/
│   │   ├── MerchantNFT.sol   # Player character NFT
│   │   ├── PriceOracle.sol   # Commodity price oracle
│   │   └── GameWorld.sol     # Main game logic
│   ├── scripts/
│   │   └── deploy.js         # Deployment script
│   ├── hardhat.config.js
│   └── package.json
│
├── frontend/                  # Next.js frontend
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── providers.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── GameHeader.tsx
│   │   ├── CreateMerchant.tsx
│   │   ├── CityMap.tsx
│   │   ├── Marketplace.tsx
│   │   ├── Inventory.tsx
│   │   ├── MerchantStats.tsx
│   │   └── Leaderboard.tsx
│   ├── lib/
│   │   ├── config.ts         # Chain & contract config
│   │   └── contracts.ts      # Contract ABIs
│   ├── public/
│   │   └── images/           # Game assets
│   └── package.json
│
├── IMAGE_ASSETS_GUIDE.md     # Image generation prompts
├── SETUP.md                  # This file
└── README.md                 # Project overview
```

---

## 🎮 Game Features

### Core Gameplay
- **Create Merchant** - Mint your character NFT
- **Travel** - Move between 4 unique cities
- **Trade** - Buy and sell 5 commodities
- **Level Up** - Earn XP from trading activities
- **Leaderboard** - Compete with other merchants

### Cities & Their Specialties
| City | Cheap | Expensive |
|------|-------|-----------|
| Silverport | Balanced | Balanced |
| Goldmere | Gold, Iron | Wheat |
| Silkwind | Silk, Spices | Iron |
| Ironhold | Iron, Wheat | Silk, Spices |

### Commodities
- 🪙 Gold (baseline value)
- 🌾 Wheat (common, cheap)
- 🧵 Silk (luxury)
- 🌶️ Spices (medium luxury)
- ⚔️ Iron (industrial)

---

## 🛠 Development Commands

### Contracts
```powershell
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy locally
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost

# Deploy to Mantle Sepolia
npx hardhat run scripts/deploy.js --network mantleSepolia
```

### Frontend
```powershell
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

---

## 📝 Hackathon Submission Checklist

### Required Deliverables
- [ ] GitHub repository with README ✅
- [ ] Working MVP on testnet
- [ ] Demo video (3-5 minutes)
- [ ] One-pager pitch document
- [ ] Team bios and contact info

### Demo Video Script
1. Intro - What is MerchantQuest? (30s)
2. Problem - Financial literacy crisis (30s)
3. Solution - Gamified learning (30s)
4. Live Demo - Create merchant, travel, trade (2-3min)
5. Tech - Mantle integration (30s)
6. Closing - Future roadmap (30s)

---

## 🐛 Troubleshooting

### Common Issues

**"Cannot find module" errors in VS Code:**
- Run `npm install` in both contracts/ and frontend/
- Restart VS Code

**Contract deployment fails:**
- Check PRIVATE_KEY in .env
- Ensure you have testnet MNT for gas

**Frontend can't connect to contracts:**
- Verify contract addresses in .env.local
- Check MetaMask is on Mantle Sepolia

**Transactions failing:**
- Check gas settings
- Verify contract permissions are set correctly

---

Good luck with the hackathon! 🏆
