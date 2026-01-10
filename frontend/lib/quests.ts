// Quest & Mission System for MerchantQuest
// Adds engaging gameplay loops without gambling mechanics (100% Halal)

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'delivery' | 'profit' | 'travel' | 'trade' | 'collect';
  icon: string;
  
  // Requirements
  requirements: {
    commodity?: number;      // Commodity ID to deliver/trade
    quantity?: number;       // Amount needed
    targetCity?: number;     // Destination city
    profitAmount?: number;   // Profit target
    tradeCount?: number;     // Number of trades
    visitCities?: number[];  // Cities to visit
  };
  
  // Rewards (no gambling - fixed rewards based on effort)
  rewards: {
    gold: number;
    experience: number;
    badge?: string;          // Achievement badge ID
    title?: string;          // Unlockable title
  };
  
  // Difficulty & Time
  difficulty: 'beginner' | 'easy' | 'medium' | 'hard' | 'legendary';
  timeLimit?: number;        // In seconds, undefined = no limit
  
  // Educational aspect
  lesson?: string;           // Trading lesson this quest teaches
}

export interface DailyQuest extends Quest {
  refreshTime: number;       // Timestamp when quest refreshes
  completed: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'trading' | 'exploration' | 'wealth' | 'mastery';
  requirement: {
    type: string;
    value: number;
  };
  reward: {
    gold: number;
    experience: number;
    title?: string;
  };
  unlockedAt?: number;
}

// ============================================
// QUEST DEFINITIONS
// ============================================

export const TUTORIAL_QUESTS: Quest[] = [
  {
    id: 'tutorial_1',
    title: '📚 Your First Trade',
    description: 'Buy 1 unit of Wheat from the market. Wheat is cheap and perfect for beginners!',
    type: 'trade',
    icon: '🌾',
    requirements: { commodity: 1, quantity: 1 },
    rewards: { gold: 50, experience: 10 },
    difficulty: 'beginner',
    lesson: 'Trading Basics: Buy commodities when prices are low, sell when high. Each city has different prices!'
  },
  {
    id: 'tutorial_2', 
    title: '🚢 Journey Begins',
    description: 'Travel to Goldmere, the city of riches. Different cities offer different prices!',
    type: 'travel',
    icon: '🗺️',
    requirements: { targetCity: 1 },
    rewards: { gold: 100, experience: 20 },
    difficulty: 'beginner',
    lesson: 'Arbitrage: The same commodity costs different amounts in different cities. Buy where cheap, sell where expensive!'
  },
  {
    id: 'tutorial_3',
    title: '💰 First Profit',
    description: 'Sell your Wheat in another city and make your first profit!',
    type: 'profit',
    icon: '📈',
    requirements: { profitAmount: 10 },
    rewards: { gold: 150, experience: 30 },
    difficulty: 'beginner',
    lesson: 'Profit = Sell Price - Buy Price - Travel Cost. Always calculate if the trip is worth it!'
  }
];

export const DAILY_QUEST_TEMPLATES: Omit<Quest, 'id'>[] = [
  // Delivery Quests
  {
    title: '🌾 Wheat Shortage in Ironhold',
    description: 'The blacksmiths of Ironhold need wheat to feed their workers. Deliver 5 Wheat to Ironhold.',
    type: 'delivery',
    icon: '🌾',
    requirements: { commodity: 1, quantity: 5, targetCity: 3 },
    rewards: { gold: 200, experience: 50 },
    difficulty: 'easy',
    lesson: 'Supply & Demand: Cities that produce less of a commodity will pay more for it.'
  },
  {
    title: '🧵 Silk for the Nobles',
    description: 'Goldmere nobles demand fine Silk. Deliver 3 Silk to Goldmere.',
    type: 'delivery',
    icon: '🧵',
    requirements: { commodity: 2, quantity: 3, targetCity: 1 },
    rewards: { gold: 350, experience: 75 },
    difficulty: 'medium',
    lesson: 'Luxury goods like Silk have higher margins but require more capital.'
  },
  {
    title: '🌶️ Spice Trade Route',
    description: 'The famous Spice Route! Deliver 3 Spices from Silkwind to Silverport.',
    type: 'delivery',
    icon: '🌶️',
    requirements: { commodity: 3, quantity: 3, targetCity: 0 },
    rewards: { gold: 400, experience: 80 },
    difficulty: 'medium',
    lesson: 'Historical trade routes existed because of price differences between regions.'
  },
  {
    title: '⚔️ Iron for War',
    description: 'Ironhold needs more Iron for their forges. Deliver 10 Iron to Ironhold.',
    type: 'delivery',
    icon: '⚔️',
    requirements: { commodity: 4, quantity: 10, targetCity: 3 },
    rewards: { gold: 500, experience: 100 },
    difficulty: 'hard',
    lesson: 'Bulk trading reduces per-unit travel costs but requires more capital.'
  },
  
  // Profit Quests
  {
    title: '📊 Day Trader',
    description: 'Make 300 gold profit from trading today.',
    type: 'profit',
    icon: '📊',
    requirements: { profitAmount: 300 },
    rewards: { gold: 100, experience: 60 },
    difficulty: 'easy',
    lesson: 'Consistent small profits compound over time. Patience is key!'
  },
  {
    title: '🎯 Big Score',
    description: 'Make 1000 gold profit in a single trading session.',
    type: 'profit',
    icon: '💎',
    requirements: { profitAmount: 1000 },
    rewards: { gold: 300, experience: 120 },
    difficulty: 'hard',
    lesson: 'High profit requires high capital. Reinvest your earnings wisely.'
  },
  
  // Trade Volume Quests
  {
    title: '🔄 Active Trader',
    description: 'Complete 5 trades (buy or sell) today.',
    type: 'trade',
    icon: '🔄',
    requirements: { tradeCount: 5 },
    rewards: { gold: 150, experience: 40 },
    difficulty: 'easy',
    lesson: 'Market activity creates liquidity. Active traders find more opportunities.'
  },
  {
    title: '⚡ Trading Frenzy',
    description: 'Complete 15 trades in one session!',
    type: 'trade',
    icon: '⚡',
    requirements: { tradeCount: 15 },
    rewards: { gold: 400, experience: 100 },
    difficulty: 'medium',
    lesson: 'High-frequency trading works best with commodities that have high price volatility.'
  },
  
  // Exploration Quests
  {
    title: '🌍 World Explorer',
    description: 'Visit all 4 cities in the realm.',
    type: 'travel',
    icon: '🌍',
    requirements: { visitCities: [0, 1, 2, 3] },
    rewards: { gold: 250, experience: 75, badge: 'explorer' },
    difficulty: 'easy',
    lesson: 'Knowledge of all markets gives you trading advantages. Scout before you commit!'
  },
  {
    title: '🛤️ The Long Road',
    description: 'Travel 5 times between cities.',
    type: 'travel',
    icon: '🛤️',
    requirements: { tradeCount: 5 },
    rewards: { gold: 200, experience: 50 },
    difficulty: 'easy',
    lesson: 'Travel costs eat into profits. Plan your routes efficiently!'
  }
];

// Collect/Accumulation Quests
export const COLLECTION_QUESTS: Quest[] = [
  {
    id: 'collect_gold_1',
    title: '💰 Savings Goal',
    description: 'Accumulate 1,000 gold in your treasury.',
    type: 'collect',
    icon: '🏦',
    requirements: { profitAmount: 1000 },
    rewards: { gold: 100, experience: 50, badge: 'saver' },
    difficulty: 'easy',
    lesson: 'Saving capital allows you to take bigger trading opportunities.'
  },
  {
    id: 'collect_gold_2',
    title: '🏰 Merchant Prince',
    description: 'Accumulate 10,000 gold. You are becoming a legend!',
    type: 'collect',
    icon: '👑',
    requirements: { profitAmount: 10000 },
    rewards: { gold: 1000, experience: 500, badge: 'prince', title: 'Merchant Prince' },
    difficulty: 'legendary',
    lesson: 'True wealth is built through consistent profitable trades over time.'
  }
];

// ============================================
// ACHIEVEMENTS
// ============================================

export const ACHIEVEMENTS: Achievement[] = [
  // Trading Achievements
  {
    id: 'first_trade',
    name: 'First Steps',
    description: 'Complete your first trade',
    icon: '🎯',
    category: 'trading',
    requirement: { type: 'trades', value: 1 },
    reward: { gold: 50, experience: 10 }
  },
  {
    id: 'trader_10',
    name: 'Apprentice Trader',
    description: 'Complete 10 trades',
    icon: '📦',
    category: 'trading',
    requirement: { type: 'trades', value: 10 },
    reward: { gold: 100, experience: 50 }
  },
  {
    id: 'trader_50',
    name: 'Journeyman Merchant',
    description: 'Complete 50 trades',
    icon: '⚖️',
    category: 'trading',
    requirement: { type: 'trades', value: 50 },
    reward: { gold: 300, experience: 150, title: 'Journeyman' }
  },
  {
    id: 'trader_100',
    name: 'Master Merchant',
    description: 'Complete 100 trades',
    icon: '🏆',
    category: 'trading',
    requirement: { type: 'trades', value: 100 },
    reward: { gold: 1000, experience: 500, title: 'Master Merchant' }
  },
  
  // Exploration Achievements
  {
    id: 'visit_all',
    name: 'Worldly Trader',
    description: 'Visit all 4 cities',
    icon: '🗺️',
    category: 'exploration',
    requirement: { type: 'cities_visited', value: 4 },
    reward: { gold: 200, experience: 100 }
  },
  {
    id: 'travel_20',
    name: 'Road Warrior',
    description: 'Travel between cities 20 times',
    icon: '🛤️',
    category: 'exploration',
    requirement: { type: 'travels', value: 20 },
    reward: { gold: 250, experience: 100, title: 'Road Warrior' }
  },
  
  // Wealth Achievements
  {
    id: 'gold_1000',
    name: 'Thousand Gold Club',
    description: 'Accumulate 1,000 gold',
    icon: '💰',
    category: 'wealth',
    requirement: { type: 'gold', value: 1000 },
    reward: { gold: 100, experience: 50 }
  },
  {
    id: 'gold_5000',
    name: 'Golden Merchant',
    description: 'Accumulate 5,000 gold',
    icon: '✨',
    category: 'wealth',
    requirement: { type: 'gold', value: 5000 },
    reward: { gold: 500, experience: 200 }
  },
  {
    id: 'gold_10000',
    name: 'Merchant Tycoon',
    description: 'Accumulate 10,000 gold',
    icon: '👑',
    category: 'wealth',
    requirement: { type: 'gold', value: 10000 },
    reward: { gold: 1000, experience: 500, title: 'Tycoon' }
  },
  {
    id: 'profit_5000',
    name: 'Profit Master',
    description: 'Earn 5,000 total profit from trades',
    icon: '📈',
    category: 'wealth',
    requirement: { type: 'total_profit', value: 5000 },
    reward: { gold: 500, experience: 250 }
  },
  
  // Mastery Achievements
  {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reach merchant level 5',
    icon: '⭐',
    category: 'mastery',
    requirement: { type: 'level', value: 5 },
    reward: { gold: 300, experience: 100 }
  },
  {
    id: 'level_10',
    name: 'Veteran Trader',
    description: 'Reach merchant level 10',
    icon: '🌟',
    category: 'mastery',
    requirement: { type: 'level', value: 10 },
    reward: { gold: 1000, experience: 300, title: 'Veteran' }
  },
  {
    id: 'wheat_master',
    name: 'Grain Baron',
    description: 'Trade 100 units of Wheat',
    icon: '🌾',
    category: 'mastery',
    requirement: { type: 'commodity_0_traded', value: 100 },
    reward: { gold: 200, experience: 100 }
  },
  {
    id: 'silk_master',
    name: 'Silk Road Master',
    description: 'Trade 50 units of Silk',
    icon: '🧵',
    category: 'mastery',
    requirement: { type: 'commodity_1_traded', value: 50 },
    reward: { gold: 400, experience: 150, title: 'Silk Master' }
  }
];

// ============================================
// TRADING TIPS & LESSONS
// ============================================

export const TRADING_TIPS = [
  {
    title: "📊 Supply & Demand",
    tip: "Cities that PRODUCE a commodity sell it CHEAP. Cities that NEED it pay MORE.",
    example: "Silkwind produces Silk → buy there. Goldmere needs Silk → sell there!"
  },
  {
    title: "🧮 Calculate Profit First",
    tip: "Profit = Sell Price - Buy Price - Travel Cost. If it's negative, don't do it!",
    example: "Buy Wheat at 80, travel costs 60, sell at 120 → Profit: -20 (BAD TRADE!)"
  },
  {
    title: "💡 Buy Low, Sell High",
    tip: "Check prices in ALL cities before trading. Find the biggest price difference.",
    example: "Iron costs 100 in Ironhold but 180 in Silkwind. That's 80 gold profit per unit!"
  },
  {
    title: "📦 Bulk is Better",
    tip: "Travel cost is FIXED per trip. Carrying more goods = lower cost per item.",
    example: "Travel cost 60 gold. Carry 1 item = 60/item. Carry 10 items = 6/item!"
  },
  {
    title: "⏰ Prices Change",
    tip: "Prices fluctuate based on real-world data. Today's bad route might be good tomorrow!",
    example: "Check the Chaos Multiplier - high chaos means bigger price swings!"
  },
  {
    title: "🎯 Specialize Early",
    tip: "Master one trade route first. Learn the prices, then expand.",
    example: "Silverport ↔ Goldmere Wheat route is great for beginners!"
  },
  {
    title: "💰 Reinvest Wisely",
    tip: "Keep some gold as reserve. Don't spend everything on inventory!",
    example: "If you spend all gold, you can't buy when prices drop!"
  },
  {
    title: "🗺️ Scout First",
    tip: "Visit all cities to learn their prices before committing to big trades.",
    example: "Spend 200 gold on travel to learn routes, save 2000 gold from bad trades!"
  }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function generateDailyQuests(count: number = 3): DailyQuest[] {
  const shuffled = [...DAILY_QUEST_TEMPLATES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);
  
  const now = Date.now();
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);
  
  return selected.map((quest, index) => ({
    ...quest,
    id: `daily_${now}_${index}`,
    refreshTime: tomorrow.getTime(),
    completed: false
  }));
}

export function getDifficultyColor(difficulty: Quest['difficulty']): string {
  switch (difficulty) {
    case 'beginner': return 'text-green-400';
    case 'easy': return 'text-blue-400';
    case 'medium': return 'text-yellow-400';
    case 'hard': return 'text-orange-400';
    case 'legendary': return 'text-purple-400';
    default: return 'text-gray-400';
  }
}

export function getDifficultyBg(difficulty: Quest['difficulty']): string {
  switch (difficulty) {
    case 'beginner': return 'bg-green-400/20 border-green-400/50';
    case 'easy': return 'bg-blue-400/20 border-blue-400/50';
    case 'medium': return 'bg-yellow-400/20 border-yellow-400/50';
    case 'hard': return 'bg-orange-400/20 border-orange-400/50';
    case 'legendary': return 'bg-purple-400/20 border-purple-400/50';
    default: return 'bg-gray-400/20 border-gray-400/50';
  }
}

export function getRandomTip(): typeof TRADING_TIPS[0] {
  return TRADING_TIPS[Math.floor(Math.random() * TRADING_TIPS.length)];
}
