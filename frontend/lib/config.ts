import { http, createConfig } from 'wagmi';
import { defineChain } from 'viem';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// Define Mantle Sepolia chain
export const mantleSepolia = defineChain({
  id: 5003,
  name: 'Mantle Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.mantle.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Mantle Sepolia Explorer', url: 'https://sepolia.mantlescan.xyz' },
  },
  testnet: true,
});

// Contract addresses (update after deployment)
export const CONTRACT_ADDRESSES = {
  priceOracle: process.env.NEXT_PUBLIC_PRICE_ORACLE_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000',
  merchantNFT: process.env.NEXT_PUBLIC_MERCHANT_NFT_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000',
  gameWorld: process.env.NEXT_PUBLIC_GAME_WORLD_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000',
};

// Wagmi config with RainbowKit
export const config = getDefaultConfig({
  appName: 'MerchantQuest',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [mantleSepolia],
  transports: {
    [mantleSepolia.id]: http(),
  },
  ssr: true,
});

// Game constants
export const COMMODITIES = [
  { id: 0, name: 'Gold', icon: '🪙', color: 'text-yellow-400' },
  { id: 1, name: 'Wheat', icon: '🌾', color: 'text-amber-300' },
  { id: 2, name: 'Silk', icon: '🧵', color: 'text-purple-300' },
  { id: 3, name: 'Spices', icon: '🌶️', color: 'text-red-400' },
  { id: 4, name: 'Iron', icon: '⚔️', color: 'text-gray-400' },
];

export const CITIES = [
  { 
    id: 0, 
    name: 'Silverport', 
    description: 'A bustling trade hub where merchants from all lands gather.',
    specialty: 'Balanced prices',
    icon: '🏛️'
  },
  { 
    id: 1, 
    name: 'Goldmere', 
    description: 'Mountain city rich in precious metals but lacking farmland.',
    specialty: 'Cheap Gold, Expensive Wheat',
    icon: '⛰️'
  },
  { 
    id: 2, 
    name: 'Silkwind', 
    description: 'Eastern city famous for its silk weavers and spice markets.',
    specialty: 'Cheap Silk & Spices, Needs Iron',
    icon: '🏯'
  },
  { 
    id: 3, 
    name: 'Ironhold', 
    description: 'Fortress city with vast mines and fertile plains.',
    specialty: 'Cheap Iron & Wheat, Wants Luxuries',
    icon: '🏰'
  },
];

export const ACHIEVEMENTS = [
  { id: 'first_trade', name: 'First Trade', description: 'Complete your first trade', icon: '📜' },
  { id: 'first_travel', name: 'Wanderer', description: 'Travel to a new city', icon: '🗺️' },
  { id: 'trader_10', name: 'Seasoned Trader', description: 'Complete 10 trades', icon: '⚖️' },
  { id: 'profit_1000', name: 'Profit Master', description: 'Earn 1000 gold profit', icon: '💰' },
];
