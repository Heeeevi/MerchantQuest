'use client';

import { useState, useEffect } from 'react';
import { COMMODITIES, CITIES } from '@/lib/config';

interface Trade {
  id: string;
  player: string;
  action: 'buy' | 'sell';
  commodity: number;
  quantity: number;
  city: number;
  price: number;
  timestamp: number;
}

// Generate dummy trades for demo
const generateDummyTrade = (): Trade => {
  const players = [
    'MerchantKing', 'SilkTrader', 'GoldHunter', 'SpiceLord', 'IronMaster',
    'WealthSeeker', 'TradeMaster', 'CoinCollector', 'RouteRunner', 'ProfitPro',
    'SilverHand', 'GoldenPath', 'EastTrader', 'WestMerchant', 'NorthVenture'
  ];
  
  return {
    id: Math.random().toString(36).slice(2),
    player: players[Math.floor(Math.random() * players.length)],
    action: Math.random() > 0.5 ? 'buy' : 'sell',
    commodity: Math.floor(Math.random() * 5),
    quantity: Math.floor(Math.random() * 10) + 1,
    city: Math.floor(Math.random() * 4),
    price: Math.floor(Math.random() * 200) + 50,
    timestamp: Date.now(),
  };
};

export default function LiveTradeTicker() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // Generate initial trades
  useEffect(() => {
    const initialTrades = Array.from({ length: 10 }, generateDummyTrade);
    setTrades(initialTrades);
  }, []);

  // Add new trades periodically
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setTrades(prev => {
        const newTrade = generateDummyTrade();
        return [newTrade, ...prev.slice(0, 19)]; // Keep last 20 trades
      });
    }, 3000 + Math.random() * 2000); // Every 3-5 seconds

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div 
      className="bg-ink/80 border-y border-gold/30 py-2 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center">
        {/* Label */}
        <div className="flex-shrink-0 px-4 py-1 bg-gold text-ink font-bold text-sm rounded-r-full mr-4">
          📊 LIVE TRADES
        </div>

        {/* Scrolling Trades */}
        <div className="overflow-hidden flex-1">
          <div 
            className={`flex gap-6 whitespace-nowrap ${isPaused ? '' : 'animate-marquee'}`}
            style={{
              animation: isPaused ? 'none' : 'marquee 30s linear infinite',
            }}
          >
            {trades.map((trade) => {
              const commodity = COMMODITIES[trade.commodity];
              const city = CITIES[trade.city];
              const isProfit = trade.action === 'sell';
              
              return (
                <div 
                  key={trade.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className={`font-bold ${isProfit ? 'text-green-400' : 'text-blue-400'}`}>
                    {isProfit ? '📈' : '📉'}
                  </span>
                  <span className="text-parchment/80">{trade.player}</span>
                  <span className={isProfit ? 'text-green-400' : 'text-blue-400'}>
                    {trade.action === 'buy' ? 'bought' : 'sold'}
                  </span>
                  <span className="text-gold font-bold">
                    {trade.quantity}x {commodity?.icon} {commodity?.name}
                  </span>
                  <span className="text-parchment/60">in {city?.name}</span>
                  <span className="text-gold">
                    💰 {trade.price * trade.quantity}
                  </span>
                  <span className="text-parchment/30 mx-2">|</span>
                </div>
              );
            })}
            
            {/* Duplicate for seamless loop */}
            {trades.map((trade) => {
              const commodity = COMMODITIES[trade.commodity];
              const city = CITIES[trade.city];
              const isProfit = trade.action === 'sell';
              
              return (
                <div 
                  key={`dup-${trade.id}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className={`font-bold ${isProfit ? 'text-green-400' : 'text-blue-400'}`}>
                    {isProfit ? '📈' : '📉'}
                  </span>
                  <span className="text-parchment/80">{trade.player}</span>
                  <span className={isProfit ? 'text-green-400' : 'text-blue-400'}>
                    {trade.action === 'buy' ? 'bought' : 'sold'}
                  </span>
                  <span className="text-gold font-bold">
                    {trade.quantity}x {commodity?.icon} {commodity?.name}
                  </span>
                  <span className="text-parchment/60">in {city?.name}</span>
                  <span className="text-gold">
                    💰 {trade.price * trade.quantity}
                  </span>
                  <span className="text-parchment/30 mx-2">|</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CSS for marquee animation */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
