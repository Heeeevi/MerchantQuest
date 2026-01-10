'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  DailyQuest, 
  Achievement,
  TUTORIAL_QUESTS, 
  ACHIEVEMENTS,
  generateDailyQuests,
  TRADING_TIPS
} from '@/lib/quests';
import {
  getProgress,
  saveProgress,
  claimAchievementReward,
  isAchievementClaimed,
  getBadgeImage,
  GameProgress
} from '@/lib/gameProgress';
import ShareAchievement from './ShareAchievement';

interface QuestBoardProps {
  merchantName: string;
  merchantLevel: number;
  gold: number;
  totalTrades: number;
  totalProfit: number;
  currentCity: number;
  citiesVisited: number[];
  onRewardClaimed?: (gold: number, experience: number) => void;
}

export default function QuestBoard({
  merchantName,
  merchantLevel,
  gold,
  totalTrades,
  totalProfit,
  currentCity,
  citiesVisited,
  onRewardClaimed
}: QuestBoardProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'tutorial' | 'achievements' | 'tips'>('daily');
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([]);
  const [gameProgress, setGameProgress] = useState<GameProgress | null>(null);
  const [currentTip, setCurrentTip] = useState(TRADING_TIPS[0]);
  const [showTipDetail, setShowTipDetail] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState<{
    type: 'achievement';
    data: { merchantName: string; achievementName: string; achievementIcon: string };
  } | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    setGameProgress(getProgress());
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('merchantquest_daily_quests');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed[0]?.refreshTime > Date.now()) {
        setDailyQuests(parsed);
        return;
      }
    }
    const newQuests = generateDailyQuests(3);
    setDailyQuests(newQuests);
    localStorage.setItem('merchantquest_daily_quests', JSON.stringify(newQuests));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * TRADING_TIPS.length);
      setCurrentTip(TRADING_TIPS[randomIndex]);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (gameProgress) {
      const updated = { ...gameProgress };
      ACHIEVEMENTS.forEach(achievement => {
        if (updated.unlockedAchievements.includes(achievement.id)) return;
        let isUnlocked = false;
        switch (achievement.requirement.type) {
          case 'trades': isUnlocked = totalTrades >= achievement.requirement.value; break;
          case 'gold': isUnlocked = gold >= achievement.requirement.value; break;
          case 'total_profit': isUnlocked = totalProfit >= achievement.requirement.value; break;
          case 'level': isUnlocked = merchantLevel >= achievement.requirement.value; break;
          case 'cities_visited': isUnlocked = citiesVisited.length >= achievement.requirement.value; break;
        }
        if (isUnlocked) updated.unlockedAchievements.push(achievement.id);
      });
      if (JSON.stringify(updated) !== JSON.stringify(gameProgress)) {
        saveProgress(updated);
        setGameProgress(updated);
      }
    }
  }, [totalTrades, totalProfit, gold, merchantLevel, citiesVisited, gameProgress]);

  const getAchievementProgress = useCallback((achievement: Achievement): number => {
    switch (achievement.requirement.type) {
      case 'trades': return Math.min((totalTrades / achievement.requirement.value) * 100, 100);
      case 'gold': return Math.min((gold / achievement.requirement.value) * 100, 100);
      case 'total_profit': return Math.min((totalProfit / achievement.requirement.value) * 100, 100);
      case 'level': return Math.min((merchantLevel / achievement.requirement.value) * 100, 100);
      case 'cities_visited': return Math.min((citiesVisited.length / achievement.requirement.value) * 100, 100);
      default: return 0;
    }
  }, [totalTrades, totalProfit, gold, merchantLevel, citiesVisited]);

  const isAchievementUnlocked = useCallback((achievement: Achievement): boolean => {
    return gameProgress?.unlockedAchievements.includes(achievement.id) || getAchievementProgress(achievement) >= 100;
  }, [gameProgress, getAchievementProgress]);

  const handleClaimAchievement = async (achievement: Achievement) => {
    if (!isAchievementUnlocked(achievement) || isAchievementClaimed(achievement.id)) return;
    setClaimingId(achievement.id);
    await new Promise(resolve => setTimeout(resolve, 500));
    const success = claimAchievementReward(achievement.id);
    if (success) {
      onRewardClaimed?.(achievement.reward.gold, achievement.reward.experience);
      setGameProgress(getProgress());
      setShareData({ type: 'achievement', data: { merchantName, achievementName: achievement.name, achievementIcon: achievement.icon } });
      setShowShareModal(true);
    }
    setClaimingId(null);
  };

  const getTimeUntilReset = (): string => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    const diff = tomorrow.getTime() - now.getTime();
    return Math.floor(diff / 3600000) + 'h ' + Math.floor((diff % 3600000) / 60000) + 'm';
  };

  const tutorialStep = gameProgress?.tutorialStep || 0;

  return (
    <div className="card-medieval">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-amber-700">Quest Board</h2>
        <div className="text-xs text-gray-600 bg-amber-100 px-2 py-1 rounded">Resets: {getTimeUntilReset()}</div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {[
          { id: 'daily', label: 'Daily', count: dailyQuests.filter(q => !q.completed).length },
          { id: 'tutorial', label: 'Tutorial', count: Math.max(0, TUTORIAL_QUESTS.length - tutorialStep) },
          { id: 'achievements', label: 'Badges', count: gameProgress?.unlockedAchievements.length || 0 },
          { id: 'tips', label: 'Tips' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={"px-4 py-2 rounded-lg border-2 transition-all whitespace-nowrap flex items-center gap-2 " + (activeTab === tab.id ? 'bg-amber-600 border-amber-700 text-white' : 'bg-white border-amber-300 text-gray-700')}>
            {tab.label} {tab.count !== undefined && <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{tab.count}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'achievements' && (
        <div className="space-y-4">
          {['trading', 'exploration', 'wealth', 'mastery'].map(category => (
            <div key={category}>
              <h3 className="text-sm font-bold text-amber-700 uppercase mb-2">
                {category === 'trading' ? 'Trading' : category === 'exploration' ? 'Exploration' : category === 'wealth' ? 'Wealth' : 'Mastery'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ACHIEVEMENTS.filter(a => a.category === category).map(achievement => {
                  const progress = getAchievementProgress(achievement);
                  const unlocked = isAchievementUnlocked(achievement);
                  const claimed = isAchievementClaimed(achievement.id);
                  const badgeImg = getBadgeImage(achievement.id);
                  return (
                    <div key={achievement.id} className={"p-3 rounded-lg border-2 " + (unlocked ? (claimed ? 'bg-gray-50 border-gray-300' : 'bg-amber-50 border-amber-400') : 'bg-white border-gray-200')}>
                      <div className="flex items-start gap-3">
                        <div className="relative w-12 h-12 flex-shrink-0">
                          {badgeImg ? <Image src={badgeImg} alt={achievement.name} fill className={unlocked ? 'object-contain' : 'object-contain grayscale opacity-40'} /> : <span className={"text-3xl " + (unlocked ? '' : 'grayscale opacity-40')}>{achievement.icon}</span>}
                          {unlocked && !claimed && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={"font-bold text-sm " + (unlocked ? 'text-amber-700' : 'text-gray-500')}>{achievement.name}</h4>
                          <p className="text-xs text-gray-500 truncate">{achievement.description}</p>
                          {!unlocked && <div className="mt-2"><div className="h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{width: progress + '%'}} /></div><p className="text-xs text-gray-400 mt-1">{Math.round(progress)}%</p></div>}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 text-xs text-gray-500"><span>{achievement.reward.gold}g</span><span>{achievement.reward.experience}xp</span></div>
                            {unlocked && !claimed && <button onClick={() => handleClaimAchievement(achievement)} disabled={claimingId === achievement.id} className="px-2 py-1 bg-amber-500 text-white text-xs rounded font-bold">{claimingId === achievement.id ? '...' : 'Claim!'}</button>}
                            {claimed && <span className="text-xs text-green-600 font-bold">Claimed</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'tips' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-300 cursor-pointer" onClick={() => setShowTipDetail(!showTipDetail)}>
            <h3 className="text-lg font-bold text-amber-700 mb-2">{currentTip.title}</h3>
            <p className="text-gray-700 mb-2">{currentTip.tip}</p>
            {showTipDetail && <div className="mt-3 p-3 bg-white rounded border border-amber-200"><p className="text-sm text-gray-600">Example: {currentTip.example}</p></div>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {TRADING_TIPS.map((tip, i) => <div key={i} className="p-3 bg-white rounded-lg border border-gray-200"><h4 className="font-bold text-sm text-gray-800 mb-1">{tip.title}</h4><p className="text-xs text-gray-600">{tip.tip}</p></div>)}
          </div>
        </div>
      )}

      {activeTab === 'daily' && <div className="text-center py-8 text-gray-500">Daily quests coming soon!</div>}
      {activeTab === 'tutorial' && <div className="text-center py-8 text-gray-500">Tutorial steps coming soon!</div>}

      {showShareModal && shareData && <ShareAchievement type={shareData.type} data={shareData.data} onClose={() => { setShowShareModal(false); setShareData(null); }} />}
    </div>
  );
}
