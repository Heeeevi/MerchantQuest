// Image paths configuration
// Maps game entities to actual image files

export const IMAGES = {
  // Logo & Branding
  logo: '/images/favicon.png', // Using favicon as logo for now
  favicon: '/images/favicon.png',
  
  // Cities (using .jpeg format)
  cities: {
    silverport: '/images/cities/silverport.jpeg',
    goldmere: '/images/cities/goldmere.jpeg',
    silkwind: '/images/cities/silkwind.jpeg',
    ironhold: '/images/cities/ironhold.jpeg',
  },
  
  // Get city image by ID
  getCityImage: (cityId: number): string => {
    const cityMap: Record<number, string> = {
      0: '/images/cities/silverport.jpeg',
      1: '/images/cities/goldmere.jpeg',
      2: '/images/cities/silkwind.jpeg',
      3: '/images/cities/ironhold.jpeg',
    };
    return cityMap[cityId] || '/images/cities/silverport.jpeg';
  },
  
  // Commodities
  commodities: {
    gold: '/images/commodities/gold.png',
    wheat: '/images/commodities/wheat.png',
    silk: '/images/commodities/silk.png',
    spices: '/images/commodities/spices.png',
    iron: '/images/commodities/iron.png',
  },
  
  // Get commodity image by ID
  getCommodityImage: (commodityId: number): string => {
    const commodityMap: Record<number, string> = {
      0: '/images/commodities/gold.png',
      1: '/images/commodities/wheat.png',
      2: '/images/commodities/silk.png',
      3: '/images/commodities/spices.png',
      4: '/images/commodities/iron.png',
    };
    return commodityMap[commodityId] || '/images/commodities/gold.png';
  },
  
  // Characters
  characters: {
    portrait: '/images/characters/Portrait.png',
    fullBody: '/images/characters/Char1.png',
  },
  
  // Achievement badges
  badges: {
    firstTrade: '/images/badges/badge-first-trade.png',
    explorer: '/images/badges/badge-explorer.png',
    profitMaster: '/images/badges/badge-profit-master.png',
    seasonedTrader: '/images/badges/badge-seasoned-trade.png',
  },
  
  // Get badge image by achievement ID
  getBadgeImage: (achievementId: string): string => {
    const badgeMap: Record<string, string> = {
      'first_trade': '/images/badges/badge-first-trade.png',
      'first_travel': '/images/badges/badge-explorer.png',
      'explorer': '/images/badges/badge-explorer.png',
      'trader_10': '/images/badges/badge-seasoned-trade.png',
      'trader_50': '/images/badges/badge-seasoned-trade.png',
      'profit_1000': '/images/badges/badge-profit-master.png',
      'profit_10000': '/images/badges/badge-profit-master.png',
    };
    return badgeMap[achievementId] || '/images/badges/badge-first-trade.png';
  },
  
  // UI Elements
  ui: {
    buttonGold: '/images/ui/ui-button-gold.png',
    panelFrame: '/images/ui/ui-panel-frame.png',
  },
  
  // Effects
  fx: {
    goldSparkle: '/images/fx/fx-gold-sparkle.png',
    levelUp: '/images/fx/fx-level-up.png', // TODO: Add this asset
  },
  
  // Textures (using .jpeg format)
  textures: {
    parchment: '/images/textures/parchment.jpeg',
    map: '/images/textures/map.jpeg',
  },
  
  // Social/Marketing
  social: {
    ogImage: '/images/og-image.jpeg',
    twitterCard: '/images/twitter-card.jpeg',
  },
};

// City names for easy lookup
export const CITY_NAMES: Record<number, string> = {
  0: 'Silverport',
  1: 'Goldmere', 
  2: 'Silkwind',
  3: 'Ironhold',
};

// Commodity names for easy lookup
export const COMMODITY_NAMES: Record<number, string> = {
  0: 'Gold',
  1: 'Wheat',
  2: 'Silk',
  3: 'Spices',
  4: 'Iron',
};

export default IMAGES;
