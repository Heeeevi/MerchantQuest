'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect } from 'react';
import { MERCHANT_NFT_ABI, GAME_WORLD_ABI } from '@/lib/contracts';
import { CONTRACT_ADDRESSES, COMMODITIES, CITIES } from '@/lib/config';
import { formatUnits } from 'viem';

// Components
import GameHeader from '@/components/GameHeader';
import CreateMerchant from '@/components/CreateMerchant';
import WorldMap from '@/components/WorldMap';
import Inventory from '@/components/Inventory';
import MerchantStats from '@/components/MerchantStats';
import Leaderboard from '@/components/Leaderboard';
import QuestBoard from '@/components/QuestBoard';
import TradingGuide from '@/components/TradingGuide';
import LandingPage from '@/components/LandingPage';
import LiveTradeTicker from '@/components/LiveTradeTicker';
import EmergencyTravelFix from '@/components/EmergencyTravelFix';
import QuickShare from '@/components/QuickShare';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'map' | 'inventory' | 'quests' | 'leaderboard'>('map');
  const [citiesVisited, setCitiesVisited] = useState<number[]>([0]);
  const [showGame, setShowGame] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if player has merchant
  const { data: hasMerchant, refetch: refetchHasMerchant } = useReadContract({
    address: CONTRACT_ADDRESSES.merchantNFT,
    abi: MERCHANT_NFT_ABI,
    functionName: 'hasMerchant',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Get merchant data
  const { data: merchantData, refetch: refetchMerchant } = useReadContract({
    address: CONTRACT_ADDRESSES.merchantNFT,
    abi: MERCHANT_NFT_ABI,
    functionName: 'getMerchantByPlayer',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!hasMerchant,
    },
  });

  // Track cities visited
  useEffect(() => {
    if (merchantData?.[1]) {
      const currentCity = Number(merchantData[1].currentCity);
      setCitiesVisited(prev => {
        if (!prev.includes(currentCity)) {
          return [...prev, currentCity];
        }
        return prev;
      });
    }
  }, [merchantData]);

  // Refresh data periodically
  useEffect(() => {
    if (isConnected && hasMerchant) {
      const interval = setInterval(() => {
        refetchMerchant();
      }, 5000); // Every 5 seconds for better responsiveness
      return () => clearInterval(interval);
    }
  }, [isConnected, hasMerchant, refetchMerchant]);

  // Show landing page if not connected or user hasn't clicked play
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">⚔️</div>
          <p className="text-gold text-xl">Loading MerchantQuest...</p>
        </div>
      </div>
    );
  }

  // Landing page for new visitors
  if (!isConnected && !showGame) {
    return <LandingPage onPlay={() => setShowGame(true)} />;
  }

  // Not connected but clicked play - show connect prompt
  if (!isConnected) {
    return (
      <main className="min-h-screen flex flex-col">
        <GameHeader />
        <LiveTradeTicker />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="card-medieval max-w-lg text-center">
            <h1 className="text-4xl font-bold mb-4 text-gold">⚔️ Connect Wallet</h1>
            <p className="text-ink/80 text-lg mb-6">
              Connect your wallet to start your merchant journey on Mantle Network!
            </p>
            <div className="mb-6 p-4 bg-gold/10 rounded-lg border border-gold/30">
              <p className="text-sm text-ink/70">
                💡 Make sure you have Mantle Sepolia testnet configured and some MNT for gas fees.
              </p>
            </div>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
            <button 
              onClick={() => setShowGame(false)}
              className="mt-4 text-sm text-ink/50 hover:text-ink transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  // No merchant yet
  if (!hasMerchant) {
    return (
      <main className="min-h-screen flex flex-col">
        <GameHeader />
        <LiveTradeTicker />
        <div className="flex-1 flex items-center justify-center p-8">
          <CreateMerchant onSuccess={() => refetchHasMerchant()} />
        </div>
      </main>
    );
  }

  // Main game UI
  const merchant = merchantData?.[1];
  const merchantId = merchantData?.[0];

  return (
    <main className="min-h-screen flex flex-col">
      <GameHeader />
      <LiveTradeTicker />
      
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Merchant Stats Bar */}
          {merchant && (
            <MerchantStats 
              merchant={merchant} 
              merchantId={merchantId}
              onRefresh={refetchMerchant}
            />
          )}

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: 'map', label: '🗺️ World & Trade', icon: '🗺️' },
              { id: 'inventory', label: '🎒 Inventory', icon: '🎒' },
              { id: 'quests', label: '📜 Quests', icon: '📜' },
              { id: 'leaderboard', label: '🏆 Leaderboard', icon: '🏆' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gold text-ink'
                    : 'bg-ink-light/80 text-parchment hover:bg-ink-light border border-gold/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[500px]">
            {activeTab === 'map' && merchant && (
              <WorldMap 
                currentCity={Number(merchant.currentCity)} 
                gold={Number(merchant.gold)}
                onTravel={() => {
                  refetchMerchant();
                  // Track visited city
                  const newCity = Number(merchant.currentCity);
                  setCitiesVisited(prev => 
                    prev.includes(newCity) ? prev : [...prev, newCity]
                  );
                }}
                onTrade={refetchMerchant}
              />
            )}
            {activeTab === 'inventory' && (
              <Inventory onSell={refetchMerchant} />
            )}
            {activeTab === 'quests' && merchant && (
              <QuestBoard 
                merchantName={merchant.name}
                merchantLevel={Number(merchant.level)}
                gold={Number(merchant.gold)}
                totalTrades={Number(merchant.totalTrades)}
                totalProfit={Number(merchant.totalProfit)}
                currentCity={Number(merchant.currentCity)}
                citiesVisited={citiesVisited}
              />
            )}
            {activeTab === 'leaderboard' && (
              <Leaderboard />
            )}
          </div>

          {/* Trading Guide for new players */}
          {merchant && (
            <TradingGuide 
              isNewPlayer={Number(merchant.totalTrades) < 5}
              currentCity={Number(merchant.currentCity)}
              gold={Number(merchant.gold)}
            />
          )}

          {/* Emergency Travel Fix Tool */}
          {hasMerchant && <EmergencyTravelFix />}

          {/* Quick Share Button */}
          {merchant && (
            <QuickShare
              merchantName={merchant.name}
              level={Number(merchant.level)}
              gold={Number(merchant.gold)}
              totalProfit={Number(merchant.totalProfit)}
              totalTrades={Number(merchant.totalTrades)}
              currentCity={Number(merchant.currentCity)}
            />
          )}
        </div>
      </div>
    </main>
  );
}
