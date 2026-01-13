'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  Quest,
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

  // Helper function to calculate daily quest progress
  const getDailyQuestProgress = useCallback((quest: DailyQuest): number => {
    if (quest.completed) return 100;
    
    switch (quest.type) {
      case 'trade':
        if (quest.requirements.tradeCount) {
          return Math.min((totalTrades / quest.requirements.tradeCount) * 100, 100);
        }
        break;
      case 'profit':
        if (quest.requirements.profitAmount) {
          return Math.min((totalProfit / quest.requirements.profitAmount) * 100, 100);
        }
        break;
      case 'travel':
        if (quest.requirements.visitCities) {
          const visited = quest.requirements.visitCities.filter(c => citiesVisited.includes(c)).length;
          return Math.min((visited / quest.requirements.visitCities.length) * 100, 100);
        }
        if (quest.requirements.targetCity !== undefined) {
          return currentCity === quest.requirements.targetCity ? 100 : 0;
        }
        break;
      case 'delivery':
        // For delivery quests, check if player has the commodity and is in target city
        if (quest.requirements.targetCity !== undefined) {
          const inTargetCity = currentCity === quest.requirements.targetCity;
          return inTargetCity ? 50 : 25; // Simplified - would need inventory check
        }
        break;
      case 'collect':
        if (quest.requirements.profitAmount) {
          return Math.min((gold / quest.requirements.profitAmount) * 100, 100);
        }
        break;
    }
    return 0;
  }, [totalTrades, totalProfit, citiesVisited, currentCity, gold]);

  // Helper function to calculate tutorial quest progress
  const getTutorialQuestProgress = useCallback((quest: Quest): number => {
    switch (quest.type) {
      case 'trade':
        if (quest.requirements.quantity) {
          return Math.min((totalTrades / quest.requirements.quantity) * 100, 100);
        }
        return totalTrades > 0 ? 100 : 0;
      case 'travel':
        if (quest.requirements.targetCity !== undefined) {
          return currentCity === quest.requirements.targetCity ? 100 : 0;
        }
        if (quest.requirements.visitCities) {
          const visited = quest.requirements.visitCities.filter((c: number) => citiesVisited.includes(c)).length;
          return Math.min((visited / quest.requirements.visitCities.length) * 100, 100);
        }
        break;
      case 'profit':
        if (quest.requirements.profitAmount) {
          return Math.min((totalProfit / quest.requirements.profitAmount) * 100, 100);
        }
        break;
    }
    return 0;
  }, [totalTrades, totalProfit, citiesVisited, currentCity]);


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

      {activeTab === 'daily' && (
        <div className="space-y-3">
          {dailyQuests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Loading daily quests...</div>
          ) : (
            dailyQuests.map((quest, index) => {
              const progress = getDailyQuestProgress(quest);
              const isCompleted = quest.completed || progress >= 100;
              return (
                <div key={quest.id || index} className={`p-4 rounded-lg border-2 transition-all ${isCompleted ? 'bg-green-50 border-green-300' : 'bg-white border-amber-200 hover:border-amber-400'}`}>
                  <div className="flex items-start gap-3">
                    <div className="text-3xl flex-shrink-0">{quest.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-bold ${isCompleted ? 'text-green-700' : 'text-amber-700'}`}>{quest.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          quest.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                          quest.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                          quest.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>{quest.difficulty}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{quest.description}</p>
                      
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-amber-500'}`} 
                            style={{width: `${Math.min(progress, 100)}%`}} 
                          />
                        </div>
                      </div>
                      
                      {/* Rewards */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-amber-600">🪙 {quest.rewards.gold}g</span>
                          <span className="text-purple-600">⭐ {quest.rewards.experience}xp</span>
                        </div>
                        {isCompleted ? (
                          <span className="text-green-600 font-bold text-sm flex items-center gap-1">
                            ✅ Completed
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">In Progress</span>
                        )}
                      </div>
                      
                      {/* Lesson */}
                      {quest.lesson && (
                        <div className="mt-3 p-2 bg-amber-50 rounded border border-amber-200">
                          <p className="text-xs text-amber-700">💡 {quest.lesson}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      
      {activeTab === 'tutorial' && (
        <div className="space-y-3">
          {TUTORIAL_QUESTS.map((quest, index) => {
            const isCompleted = index < tutorialStep;
            const isCurrent = index === tutorialStep;
            const isLocked = index > tutorialStep;
            const progress = isCurrent ? getTutorialQuestProgress(quest) : (isCompleted ? 100 : 0);
            
            return (
              <div 
                key={quest.id} 
                className={`p-4 rounded-lg border-2 transition-all ${
                  isCompleted ? 'bg-green-50 border-green-300' : 
                  isCurrent ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300' : 
                  'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`text-3xl flex-shrink-0 ${isLocked ? 'grayscale opacity-50' : ''}`}>
                    {isCompleted ? '✅' : quest.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-bold ${
                        isCompleted ? 'text-green-700' : 
                        isCurrent ? 'text-amber-700' : 
                        'text-gray-400'
                      }`}>
                        {isLocked ? '🔒 ' : ''}{quest.title}
                      </h4>
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                        Step {index + 1}/{TUTORIAL_QUESTS.length}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
                      {quest.description}
                    </p>
                    
                    {/* Progress Bar - only for current */}
                    {isCurrent && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 transition-all" 
                            style={{width: `${Math.min(progress, 100)}%`}} 
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Rewards */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 text-sm">
                        <span className={isLocked ? 'text-gray-400' : 'text-amber-600'}>🪙 {quest.rewards.gold}g</span>
                        <span className={isLocked ? 'text-gray-400' : 'text-purple-600'}>⭐ {quest.rewards.experience}xp</span>
                      </div>
                      {isCompleted && (
                        <span className="text-green-600 font-bold text-sm">✅ Done</span>
                      )}
                      {isCurrent && (
                        <span className="text-amber-600 font-bold text-sm animate-pulse">👉 Current</span>
                      )}
                    </div>
                    
                    {/* Lesson */}
                    {quest.lesson && !isLocked && (
                      <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-xs text-blue-700">📚 {quest.lesson}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showShareModal && shareData && <ShareAchievement type={shareData.type} data={shareData.data} onClose={() => { setShowShareModal(false); setShareData(null); }} />}
    </div>
  );
}
