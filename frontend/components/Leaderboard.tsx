'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { MERCHANT_NFT_ABI } from '@/lib/contracts';
import { CONTRACT_ADDRESSES } from '@/lib/config';

interface LeaderboardEntry {
  rank: number;
  address: string;
  name: string;
  level: number;
  totalProfit: number;
  trades: number;
  isYou?: boolean;
}

export default function Leaderboard() {
  const { address } = useAccount();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  // Get current user's merchant data
  const { data: userMerchantData } = useReadContract({
    address: CONTRACT_ADDRESSES.merchantNFT,
    abi: MERCHANT_NFT_ABI,
    functionName: 'getMerchantByPlayer',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Load leaderboard with real user data integration
  useEffect(() => {
    const loadLeaderboard = async () => {
      setIsLoading(true);
      
      // Base leaderboard (simulated other players - in production use indexer/subgraph)
      const baseLeaderboard: LeaderboardEntry[] = [
        { rank: 1, address: '0x7a3...8f2d', name: 'GoldenMerchant', level: 8, totalProfit: 15420, trades: 89 },
        { rank: 2, address: '0x2b4...9e1c', name: 'SilkTrader', level: 7, totalProfit: 12350, trades: 76 },
        { rank: 3, address: '0x9f8...4a2b', name: 'IronMaster', level: 6, totalProfit: 9800, trades: 65 },
        { rank: 4, address: '0x1c5...7d3e', name: 'SpiceKing', level: 5, totalProfit: 7500, trades: 54 },
        { rank: 5, address: '0x6e2...8f4a', name: 'WheatBaron', level: 5, totalProfit: 6200, trades: 48 },
        { rank: 6, address: '0x3d9...2c1f', name: 'TradeLord', level: 4, totalProfit: 5100, trades: 42 },
        { rank: 7, address: '0x8a7...5b6e', name: 'MerchantPro', level: 4, totalProfit: 4300, trades: 38 },
        { rank: 8, address: '0x4c3...1d8g', name: 'GoldSeeker', level: 3, totalProfit: 3200, trades: 29 },
        { rank: 9, address: '0x5f6...3e9h', name: 'SilkRoad', level: 3, totalProfit: 2800, trades: 25 },
        { rank: 10, address: '0x0a1...6f2i', name: 'NewTrader', level: 2, totalProfit: 1500, trades: 15 },
      ];

      // Integrate real user data if available
      if (userMerchantData && address) {
        const merchantArr = userMerchantData as unknown as [bigint, {
          name: string;
          level: bigint;
          totalProfit: bigint;
          totalTrades: bigint;
        }];
        const merchant = merchantArr[1];

        const userEntry: LeaderboardEntry = {
          rank: 0,
          address: `${address.slice(0, 6)}...${address.slice(-4)}`,
          name: merchant.name,
          level: Number(merchant.level),
          totalProfit: Number(merchant.totalProfit),
          trades: Number(merchant.totalTrades),
          isYou: true,
        };

        // Insert user at correct position based on profit
        const finalLeaderboard: LeaderboardEntry[] = [];
        let userAdded = false;
        
        for (let i = 0; i < baseLeaderboard.length; i++) {
          if (!userAdded && userEntry.totalProfit > baseLeaderboard[i].totalProfit) {
            userEntry.rank = finalLeaderboard.length + 1;
            finalLeaderboard.push(userEntry);
            userAdded = true;
          }
          baseLeaderboard[i].rank = finalLeaderboard.length + 1;
          finalLeaderboard.push(baseLeaderboard[i]);
        }
        
        if (!userAdded) {
          userEntry.rank = finalLeaderboard.length + 1;
          finalLeaderboard.push(userEntry);
        }
        
        setLeaderboard(finalLeaderboard.slice(0, 15)); // Show top 15
      } else {
        setLeaderboard(baseLeaderboard);
      }
      
      setIsLoading(false);
    };

    loadLeaderboard();
  }, [userMerchantData, address]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankStyle = (rank: number, isYou?: boolean) => {
    if (isYou) return 'bg-gradient-to-r from-blue-600/30 to-blue-400/10 border-blue-500 ring-2 ring-blue-400';
    if (rank === 1) return 'bg-gradient-to-r from-yellow-600/30 to-yellow-400/10 border-yellow-500';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/30 to-gray-300/10 border-gray-400';
    if (rank === 3) return 'bg-gradient-to-r from-amber-700/30 to-amber-500/10 border-amber-600';
    return 'bg-ink/10 border-gold/20';
  };

  const handleShare = (entry: LeaderboardEntry) => {
    setSelectedEntry(entry);
    setShowShareModal(true);
  };

  const generateShareText = (entry: LeaderboardEntry) => {
    return `🏆 MerchantQuest Achievement!\n\n` +
           `👤 ${entry.name}\n` +
           `📊 Rank: #${entry.rank}\n` +
           `⭐ Level: ${entry.level}\n` +
           `💰 Total Profit: ${entry.totalProfit.toLocaleString()} Gold\n` +
           `⚖️ Total Trades: ${entry.trades}\n\n` +
           `🎮 Play MerchantQuest on Mantle!\n` +
           `#MerchantQuest #Mantle #Web3Gaming`;
  };

  const shareToTwitter = () => {
    if (!selectedEntry) return;
    const text = encodeURIComponent(generateShareText(selectedEntry));
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const copyToClipboard = async () => {
    if (!selectedEntry) return;
    await navigator.clipboard.writeText(generateShareText(selectedEntry));
    alert('Copied to clipboard! 📋');
  };

  const downloadShareCard = async () => {
    if (!shareCardRef.current) return;
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#1a1a2e',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `merchantquest-rank-${selectedEntry?.rank}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Failed to generate image:', error);
      alert('Failed to generate image. Please try copying the text instead.');
    }
  };

  // Find user's rank
  const userRank = leaderboard.find(e => e.isYou)?.rank;

  if (isLoading) {
    return (
      <div className="card-medieval">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
          <span className="ml-3 text-gold">Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card-medieval">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gold">🏆 Leaderboard</h2>
          <p className="text-sm text-ink/60">Top merchants in the realm</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full animate-pulse">
            🟢 Live
          </span>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* 2nd Place */}
        <div className="order-1 md:order-1">
          <div className="bg-gradient-to-b from-gray-400/20 to-transparent rounded-t-xl p-4 text-center border border-gray-400/30 h-32 flex flex-col justify-end">
            <p className="text-3xl mb-1">🥈</p>
            <p className="font-bold truncate">{leaderboard[1]?.name}</p>
            <p className="text-xs text-ink/60">💰 {leaderboard[1]?.totalProfit.toLocaleString()}</p>
            {leaderboard[1] && (
              <button onClick={() => handleShare(leaderboard[1])} className="mt-1 text-xs text-blue-400 hover:text-blue-300">
                📤 Share
              </button>
            )}
          </div>
        </div>

        {/* 1st Place */}
        <div className="order-0 md:order-0">
          <div className="bg-gradient-to-b from-yellow-500/30 to-transparent rounded-t-xl p-4 text-center border border-yellow-500/50 h-40 flex flex-col justify-end">
            <p className="text-4xl mb-1">🥇</p>
            <p className="font-bold text-lg truncate">{leaderboard[0]?.name}</p>
            <p className="text-sm text-gold">💰 {leaderboard[0]?.totalProfit.toLocaleString()}</p>
            {leaderboard[0] && (
              <button onClick={() => handleShare(leaderboard[0])} className="mt-1 text-xs text-blue-400 hover:text-blue-300">
                📤 Share
              </button>
            )}
          </div>
        </div>

        {/* 3rd Place */}
        <div className="order-2 md:order-2">
          <div className="bg-gradient-to-b from-amber-700/20 to-transparent rounded-t-xl p-4 text-center border border-amber-600/30 h-28 flex flex-col justify-end">
            <p className="text-2xl mb-1">🥉</p>
            <p className="font-bold truncate">{leaderboard[2]?.name}</p>
            <p className="text-xs text-ink/60">💰 {leaderboard[2]?.totalProfit.toLocaleString()}</p>
            {leaderboard[2] && (
              <button onClick={() => handleShare(leaderboard[2])} className="mt-1 text-xs text-blue-400 hover:text-blue-300">
                📤 Share
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full Leaderboard */}
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-sm text-ink/60 font-bold">
          <div className="col-span-1">Rank</div>
          <div className="col-span-4">Merchant</div>
          <div className="col-span-2 text-center">Level</div>
          <div className="col-span-2 text-center">Trades</div>
          <div className="col-span-2 text-right">Profit</div>
          <div className="col-span-1 text-center">Share</div>
        </div>

        {leaderboard.map((entry) => (
          <div
            key={`${entry.rank}-${entry.name}`}
            className={`grid grid-cols-12 gap-2 items-center px-4 py-3 rounded-lg border transition-all ${getRankStyle(entry.rank, entry.isYou)}`}
          >
            <div className="col-span-1 text-xl font-bold">
              {getRankBadge(entry.rank)}
            </div>
            <div className="col-span-4">
              <p className="font-bold truncate flex items-center gap-2">
                {entry.name}
                {entry.isYou && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">YOU</span>}
              </p>
              <p className="text-xs text-ink/50">{entry.address}</p>
            </div>
            <div className="col-span-2 text-center">
              <span className="px-2 py-1 bg-gold/20 rounded text-sm">
                Lv.{entry.level}
              </span>
            </div>
            <div className="col-span-2 text-center text-ink/70">
              {entry.trades}
            </div>
            <div className="col-span-2 text-right font-bold text-gold">
              💰 {entry.totalProfit.toLocaleString()}
            </div>
            <div className="col-span-1 text-center">
              <button 
                onClick={() => handleShare(entry)}
                className="p-1 hover:bg-gold/20 rounded transition-colors"
                title="Share achievement"
              >
                📤
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Your Rank */}
      <div className="mt-6 p-4 bg-gold/10 rounded-xl border-2 border-gold/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👤</span>
            <div>
              <p className="font-bold">Your Ranking</p>
              <p className="text-sm text-ink/60">
                {userRank ? 'Keep trading to climb higher!' : 'Create a merchant to join!'}
              </p>
            </div>
          </div>
          <div className="text-right flex items-center gap-4">
            <div>
              <p className="text-sm text-ink/60">Current Rank</p>
              <p className="text-2xl font-bold text-gold">{userRank ? `#${userRank}` : 'Unranked'}</p>
            </div>
            {userRank && (
              <button
                onClick={() => {
                  const userEntry = leaderboard.find(e => e.isYou);
                  if (userEntry) handleShare(userEntry);
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg 
                         hover:from-blue-600 hover:to-purple-600 transition-all font-bold text-sm"
              >
                📤 Share Rank
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ranking Info */}
      <div className="mt-4 p-4 bg-ink/10 rounded-lg border border-gold/20">
        <h4 className="font-bold text-gold mb-2">📊 How Rankings Work</h4>
        <ul className="text-sm space-y-1 text-ink/80">
          <li>• Rankings are based on total profit earned</li>
          <li>• Your stats update in real-time from blockchain</li>
          <li>• Top 10 merchants receive special recognition</li>
          <li>• Share your achievements with friends!</li>
        </ul>
      </div>

      {/* Share Modal */}
      {showShareModal && selectedEntry && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-ink to-ink/95 rounded-2xl border-2 border-gold max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gold">📤 Share Achievement</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-ink/60 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Share Card Preview */}
            <div 
              ref={shareCardRef}
              className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 rounded-xl p-6 mb-4 relative overflow-hidden"
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl" />
              
              <div className="relative">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🏆</span>
                  <span className="text-gold font-bold text-lg">MerchantQuest</span>
                </div>

                {/* Rank Badge */}
                <div className="text-center mb-4">
                  <p className="text-6xl mb-2">{getRankBadge(selectedEntry.rank)}</p>
                  <p className="text-2xl font-bold text-white">{selectedEntry.name}</p>
                  <p className="text-gold">Rank #{selectedEntry.rank}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 bg-black/30 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-xs text-ink/60">Level</p>
                    <p className="text-xl font-bold text-gold">⭐ {selectedEntry.level}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-ink/60">Profit</p>
                    <p className="text-xl font-bold text-green-400">💰 {selectedEntry.totalProfit.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-ink/60">Trades</p>
                    <p className="text-xl font-bold text-blue-400">⚖️ {selectedEntry.trades}</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between text-xs text-ink/60">
                  <span>Built on Mantle</span>
                  <span>#MerchantQuest</span>
                </div>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={shareToTwitter}
                className="flex items-center justify-center gap-2 p-3 bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 
                         rounded-lg transition-colors border border-[#1DA1F2]/30"
              >
                <span className="text-xl">𝕏</span>
                <span className="text-sm">Share on X</span>
              </button>
              
              <button
                onClick={copyToClipboard}
                className="flex items-center justify-center gap-2 p-3 bg-gray-500/20 hover:bg-gray-500/30 
                         rounded-lg transition-colors border border-gray-500/30"
              >
                <span className="text-xl">📋</span>
                <span className="text-sm">Copy Text</span>
              </button>
            </div>

            <p className="text-center text-xs text-ink/50 mt-4">
              Share your trading achievements with the world! 🌍
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
