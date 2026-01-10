'use client';

import { useState } from 'react';

interface MerchantStatsProps {
  merchant: {
    name: string;
    level: bigint;
    experience: bigint;
    gold: bigint;
    currentCity: bigint;
    totalTrades: bigint;
    totalProfit: bigint;
  };
  merchantId: bigint | undefined;
  onRefresh: () => void;
}

import { CITIES } from '@/lib/config';
import { IMAGES } from '@/lib/images';
import Image from 'next/image';
import ShareAchievement from './ShareAchievement';

export default function MerchantStats({ merchant, merchantId, onRefresh }: MerchantStatsProps) {
  const [showShare, setShowShare] = useState(false);
  const currentCityInfo = CITIES[Number(merchant.currentCity)] || CITIES[0];
  
  // Calculate XP progress
  const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
  const currentLevel = Number(merchant.level);
  const currentXP = Number(merchant.experience);
  const currentLevelXP = levelThresholds[currentLevel - 1] || 0;
  const nextLevelXP = levelThresholds[currentLevel] || currentLevelXP + 500;
  const xpProgress = ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  return (
    <div className="card-medieval mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Merchant Info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-bronze 
                        border-2 border-gold relative overflow-hidden">
            <Image
              src={IMAGES.characters.portrait}
              alt="Merchant"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold">{merchant.name}</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gold">Level {currentLevel}</span>
              <span className="text-ink/60">•</span>
              <span>{currentCityInfo.icon} {currentCityInfo.name}</span>
            </div>
            {/* XP Bar */}
            <div className="mt-1 w-32 h-2 bg-ink/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-gold to-bronze transition-all"
                style={{ width: `${Math.min(xpProgress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-ink/60 mt-0.5">
              {currentXP} / {nextLevelXP} XP
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4">
          <div className="stat-box text-center min-w-[100px]">
            <p className="text-2xl font-bold text-gold">
              💰 {Number(merchant.gold).toLocaleString()}
            </p>
            <p className="text-xs text-ink/60">Gold</p>
          </div>
          
          <div className="stat-box text-center min-w-[100px]">
            <p className="text-2xl font-bold text-green-600">
              📈 {Number(merchant.totalProfit).toLocaleString()}
            </p>
            <p className="text-xs text-ink/60">Total Profit</p>
          </div>
          
          <div className="stat-box text-center min-w-[100px]">
            <p className="text-2xl font-bold">
              ⚖️ {Number(merchant.totalTrades)}
            </p>
            <p className="text-xs text-ink/60">Trades</p>
          </div>
        </div>

        {/* Share & Refresh Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={() => setShowShare(true)}
            className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 
                     hover:from-blue-500/30 hover:to-purple-500/30 transition-colors border border-blue-500/30"
            title="Share Profile"
          >
            📤
          </button>
          <button 
            onClick={() => onRefresh()}
            className="p-2 rounded-lg bg-ink/10 hover:bg-ink/20 transition-colors"
            title="Refresh Stats"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {showShare && (
        <ShareAchievement
          type="level_up"
          data={{
            merchantName: merchant.name,
            level: Number(merchant.level),
          }}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
