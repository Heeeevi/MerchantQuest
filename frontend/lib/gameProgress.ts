// Game Progress Tracking System
// Tracks player actions and progress for achievements and quests
// Uses localStorage for persistence (no database needed for dApp)

export interface GameProgress {
  // Trading stats
  totalTrades: number;
  totalBuys: number;
  totalSells: number;
  totalProfit: number;
  highestSingleProfit: number;
  
  // Commodity specific
  commodityTraded: {
    [commodityId: number]: number; // quantity traded per commodity
  };
  
  // Travel stats
  totalTravels: number;
  citiesVisited: number[];
  
  // Session stats
  sessionTrades: number;
  sessionProfit: number;
  sessionTravels: number;
  sessionStartTime: number;
  
  // Achievement tracking
  unlockedAchievements: string[];
  claimedAchievementRewards: string[];
  
  // Daily quest tracking
  dailyQuestProgress: {
    [questId: string]: {
      current: number;
      target: number;
      completed: boolean;
      claimed: boolean;
    };
  };
  dailyQuestDate: string; // YYYY-MM-DD
  
  // Tutorial
  tutorialStep: number;
  tutorialCompleted: boolean;
}

const STORAGE_KEY = 'merchantquest_game_progress';

const DEFAULT_PROGRESS: GameProgress = {
  totalTrades: 0,
  totalBuys: 0,
  totalSells: 0,
  totalProfit: 0,
  highestSingleProfit: 0,
  commodityTraded: {},
  totalTravels: 0,
  citiesVisited: [],
  sessionTrades: 0,
  sessionProfit: 0,
  sessionTravels: 0,
  sessionStartTime: Date.now(),
  unlockedAchievements: [],
  claimedAchievementRewards: [],
  dailyQuestProgress: {},
  dailyQuestDate: '',
  tutorialStep: 0,
  tutorialCompleted: false,
};

// Get current progress
export function getProgress(): GameProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return { ...DEFAULT_PROGRESS, sessionStartTime: Date.now() };
  
  try {
    const parsed = JSON.parse(stored);
    // Check if session needs reset (after 30 min idle)
    if (Date.now() - parsed.sessionStartTime > 30 * 60 * 1000) {
      return {
        ...parsed,
        sessionTrades: 0,
        sessionProfit: 0,
        sessionTravels: 0,
        sessionStartTime: Date.now(),
      };
    }
    return parsed;
  } catch {
    return { ...DEFAULT_PROGRESS, sessionStartTime: Date.now() };
  }
}

// Save progress
export function saveProgress(progress: GameProgress): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

// ================================
// ACTION TRACKERS
// ================================

export function trackTrade(
  type: 'buy' | 'sell',
  commodityId: number,
  quantity: number,
  profit: number = 0
): GameProgress {
  const progress = getProgress();
  
  progress.totalTrades++;
  progress.sessionTrades++;
  
  if (type === 'buy') {
    progress.totalBuys++;
  } else {
    progress.totalSells++;
    progress.totalProfit += profit;
    progress.sessionProfit += profit;
    if (profit > progress.highestSingleProfit) {
      progress.highestSingleProfit = profit;
    }
  }
  
  // Track commodity
  progress.commodityTraded[commodityId] = 
    (progress.commodityTraded[commodityId] || 0) + quantity;
  
  // Update daily quest progress
  updateDailyQuestProgress(progress, 'trade', quantity);
  if (type === 'sell' && profit > 0) {
    updateDailyQuestProgress(progress, 'profit', profit);
  }
  
  // Check tutorial
  if (progress.tutorialStep === 0 && type === 'buy') {
    progress.tutorialStep = 1;
  }
  if (progress.tutorialStep === 2 && type === 'sell' && profit > 0) {
    progress.tutorialStep = 3;
    progress.tutorialCompleted = true;
  }
  
  saveProgress(progress);
  return progress;
}

export function trackTravel(fromCity: number, toCity: number): GameProgress {
  const progress = getProgress();
  
  progress.totalTravels++;
  progress.sessionTravels++;
  
  // Track cities visited
  if (!progress.citiesVisited.includes(toCity)) {
    progress.citiesVisited.push(toCity);
  }
  
  // Update daily quest progress
  updateDailyQuestProgress(progress, 'travel', 1);
  updateDailyQuestProgress(progress, 'visit_city', toCity);
  
  // Check tutorial
  if (progress.tutorialStep === 1) {
    progress.tutorialStep = 2;
  }
  
  saveProgress(progress);
  return progress;
}

// ================================
// DAILY QUEST SYSTEM
// ================================

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function initializeDailyQuests(quests: { id: string; target: number; type: string }[]): void {
  const progress = getProgress();
  const today = getTodayString();
  
  // Reset if new day
  if (progress.dailyQuestDate !== today) {
    progress.dailyQuestDate = today;
    progress.dailyQuestProgress = {};
    
    quests.forEach(quest => {
      progress.dailyQuestProgress[quest.id] = {
        current: 0,
        target: quest.target,
        completed: false,
        claimed: false,
      };
    });
    
    saveProgress(progress);
  }
}

function updateDailyQuestProgress(
  progress: GameProgress,
  actionType: string,
  value: number
): void {
  Object.keys(progress.dailyQuestProgress).forEach(questId => {
    const quest = progress.dailyQuestProgress[questId];
    if (quest.completed) return;
    
    // Match quest type to action
    if (
      (actionType === 'trade' && questId.includes('trade')) ||
      (actionType === 'profit' && questId.includes('profit')) ||
      (actionType === 'travel' && questId.includes('travel'))
    ) {
      quest.current = Math.min(quest.current + value, quest.target);
      if (quest.current >= quest.target) {
        quest.completed = true;
      }
    }
  });
}

export function claimDailyQuestReward(questId: string): boolean {
  const progress = getProgress();
  const quest = progress.dailyQuestProgress[questId];
  
  if (!quest || !quest.completed || quest.claimed) {
    return false;
  }
  
  quest.claimed = true;
  saveProgress(progress);
  return true;
}

// ================================
// ACHIEVEMENT SYSTEM
// ================================

export interface AchievementCheck {
  id: string;
  type: string;
  value: number;
}

export function checkAchievements(
  achievements: AchievementCheck[],
  merchantLevel: number,
  gold: number
): string[] {
  const progress = getProgress();
  const newlyUnlocked: string[] = [];
  
  achievements.forEach(achievement => {
    if (progress.unlockedAchievements.includes(achievement.id)) return;
    
    let isUnlocked = false;
    
    switch (achievement.type) {
      case 'trades':
        isUnlocked = progress.totalTrades >= achievement.value;
        break;
      case 'gold':
        isUnlocked = gold >= achievement.value;
        break;
      case 'total_profit':
        isUnlocked = progress.totalProfit >= achievement.value;
        break;
      case 'level':
        isUnlocked = merchantLevel >= achievement.value;
        break;
      case 'cities_visited':
        isUnlocked = progress.citiesVisited.length >= achievement.value;
        break;
      case 'travels':
        isUnlocked = progress.totalTravels >= achievement.value;
        break;
      case 'commodity_0_traded':
        isUnlocked = (progress.commodityTraded[0] || 0) >= achievement.value;
        break;
      case 'commodity_1_traded':
        isUnlocked = (progress.commodityTraded[1] || 0) >= achievement.value;
        break;
    }
    
    if (isUnlocked) {
      progress.unlockedAchievements.push(achievement.id);
      newlyUnlocked.push(achievement.id);
    }
  });
  
  if (newlyUnlocked.length > 0) {
    saveProgress(progress);
  }
  
  return newlyUnlocked;
}

export function claimAchievementReward(achievementId: string): boolean {
  const progress = getProgress();
  
  if (!progress.unlockedAchievements.includes(achievementId)) {
    return false;
  }
  if (progress.claimedAchievementRewards.includes(achievementId)) {
    return false;
  }
  
  progress.claimedAchievementRewards.push(achievementId);
  saveProgress(progress);
  return true;
}

export function isAchievementClaimed(achievementId: string): boolean {
  const progress = getProgress();
  return progress.claimedAchievementRewards.includes(achievementId);
}

// ================================
// BADGE IMAGES MAPPING
// ================================

export const BADGE_IMAGES: { [key: string]: string } = {
  'first_trade': '/images/badges/badge-first-trade.png',
  'trader_10': '/images/badges/badge-seasoned-trade.png',
  'trader_50': '/images/badges/badge-seasoned-trade.png',
  'trader_100': '/images/badges/badge-seasoned-trade.png',
  'visit_all': '/images/badges/badge-explorer.png',
  'travel_20': '/images/badges/badge-explorer.png',
  'gold_1000': '/images/badges/badge-profit-master.png',
  'gold_5000': '/images/badges/badge-profit-master.png',
  'gold_10000': '/images/badges/badge-profit-master.png',
  'profit_5000': '/images/badges/badge-profit-master.png',
  'level_5': '/images/badges/badge-first-trade.png',
  'level_10': '/images/badges/badge-seasoned-trade.png',
  'wheat_master': '/images/badges/badge-profit-master.png',
  'silk_master': '/images/badges/badge-profit-master.png',
  'explorer': '/images/badges/badge-explorer.png',
  'saver': '/images/badges/badge-profit-master.png',
  'prince': '/images/badges/badge-profit-master.png',
};

export function getBadgeImage(achievementId: string): string | null {
  return BADGE_IMAGES[achievementId] || null;
}

// Reset progress (for testing)
export function resetProgress(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
