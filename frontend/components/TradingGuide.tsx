'use client';

import { useState, useEffect } from 'react';
import { getRandomTip, TRADING_TIPS } from '@/lib/quests';

interface TradingGuideProps {
  isNewPlayer: boolean;
  currentCity: number;
  gold: number;
}

export default function TradingGuide({ isNewPlayer, currentCity, gold }: TradingGuideProps) {
  const [showGuide, setShowGuide] = useState(false);
  const [currentTip, setCurrentTip] = useState(TRADING_TIPS[0]);
  const [tipIndex, setTipIndex] = useState(0);

  // Show guide automatically for new players
  useEffect(() => {
    if (isNewPlayer) {
      const hasSeenGuide = localStorage.getItem('merchantquest_seen_guide');
      if (!hasSeenGuide) {
        setShowGuide(true);
      }
    }
  }, [isNewPlayer]);

  const handleDismiss = () => {
    setShowGuide(false);
    localStorage.setItem('merchantquest_seen_guide', 'true');
  };

  const nextTip = () => {
    const newIndex = (tipIndex + 1) % TRADING_TIPS.length;
    setTipIndex(newIndex);
    setCurrentTip(TRADING_TIPS[newIndex]);
  };

  const prevTip = () => {
    const newIndex = tipIndex === 0 ? TRADING_TIPS.length - 1 : tipIndex - 1;
    setTipIndex(newIndex);
    setCurrentTip(TRADING_TIPS[newIndex]);
  };

  if (!showGuide) {
    return (
      <button
        onClick={() => setShowGuide(true)}
        className="fixed bottom-4 right-4 z-40 w-14 h-14 bg-gold/90 hover:bg-gold 
                 rounded-full shadow-lg flex items-center justify-center text-2xl
                 transition-all hover:scale-110 border-2 border-gold"
        title="Trading Guide"
      >
        ❓
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
      <div className="bg-parchment rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-ink text-parchment p-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            📚 Trading Guide
          </h2>
          <button
            onClick={handleDismiss}
            className="text-parchment/60 hover:text-parchment text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-ink">
          {/* Welcome for new players */}
          {isNewPlayer && (
            <div className="mb-6 p-4 bg-gold/20 rounded-lg border-2 border-gold">
              <h3 className="font-bold text-lg mb-2">🎉 Welcome, Merchant!</h3>
              <p className="text-sm">
                You&apos;re starting your journey as a medieval trader. Your goal is to 
                <strong className="text-gold"> buy low and sell high</strong> to accumulate wealth!
              </p>
            </div>
          )}

          {/* How to Play */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              🎮 How to Play
            </h3>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-2">
                <span className="bg-gold text-ink w-6 h-6 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</span>
                <div>
                  <strong>Check Prices</strong> - Each city has different prices for commodities. 
                  Look at the Market tab to see what&apos;s cheap here.
                </div>
              </li>
              <li className="flex gap-2">
                <span className="bg-gold text-ink w-6 h-6 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</span>
                <div>
                  <strong>Buy Commodities</strong> - Purchase goods that are CHEAP in your current city.
                </div>
              </li>
              <li className="flex gap-2">
                <span className="bg-gold text-ink w-6 h-6 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</span>
                <div>
                  <strong>Travel</strong> - Go to another city where your goods are EXPENSIVE. 
                  (Remember: travel costs gold!)
                </div>
              </li>
              <li className="flex gap-2">
                <span className="bg-gold text-ink w-6 h-6 rounded-full flex items-center justify-center font-bold flex-shrink-0">4</span>
                <div>
                  <strong>Sell High</strong> - Sell your commodities for profit. 
                  Profit = Sell Price - Buy Price - Travel Cost
                </div>
              </li>
              <li className="flex gap-2">
                <span className="bg-gold text-ink w-6 h-6 rounded-full flex items-center justify-center font-bold flex-shrink-0">5</span>
                <div>
                  <strong>Repeat & Level Up</strong> - More trades = more XP = higher level = 
                  better reputation!
                </div>
              </li>
            </ol>
          </div>

          {/* City Specialties */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3">🏰 City Specialties</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-blue-100 rounded border border-blue-300">
                <p className="font-bold">🏖️ Silverport</p>
                <p className="text-xs">Cheap: Wheat, Fish</p>
                <p className="text-xs text-blue-600">Coastal trading hub</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded border border-yellow-300">
                <p className="font-bold">💰 Goldmere</p>
                <p className="text-xs">Cheap: Luxury goods</p>
                <p className="text-xs text-yellow-600">City of wealth</p>
              </div>
              <div className="p-2 bg-pink-100 rounded border border-pink-300">
                <p className="font-bold">🧵 Silkwind</p>
                <p className="text-xs">Cheap: Silk, Spices</p>
                <p className="text-xs text-pink-600">Eastern trade route</p>
              </div>
              <div className="p-2 bg-gray-100 rounded border border-gray-300">
                <p className="font-bold">⚔️ Ironhold</p>
                <p className="text-xs">Cheap: Iron, Weapons</p>
                <p className="text-xs text-gray-600">Industrial forges</p>
              </div>
            </div>
          </div>

          {/* Trading Tips Carousel */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3">💡 Trading Tips</h3>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-bold text-blue-800 mb-1">{currentTip.title}</p>
              <p className="text-sm text-blue-700 mb-2">{currentTip.tip}</p>
              <p className="text-xs bg-blue-100 p-2 rounded text-blue-600">
                📝 Example: {currentTip.example}
              </p>
              <div className="flex justify-between items-center mt-3">
                <button 
                  onClick={prevTip}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ← Prev
                </button>
                <span className="text-xs text-blue-400">
                  {tipIndex + 1} / {TRADING_TIPS.length}
                </span>
                <button 
                  onClick={nextTip}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>

          {/* RWA Explanation */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3">🌍 Real World Asset Integration</h3>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-sm">
              <p className="mb-2">
                <strong>Prices in this game are connected to REAL commodity prices!</strong>
              </p>
              <p className="text-green-700 text-xs">
                Our oracle fetches real gold, wheat, and commodity prices. When real-world 
                wheat prices go up, in-game wheat prices rise too! This teaches you about 
                real market dynamics.
              </p>
            </div>
          </div>

          {/* Blockchain Info */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 text-sm">
            <h4 className="font-bold text-purple-800 mb-2">⛓️ Why Blockchain?</h4>
            <ul className="text-xs text-purple-700 space-y-1">
              <li>✓ Your merchant & progress is saved forever as NFT</li>
              <li>✓ All trades are transparent and verifiable</li>
              <li>✓ No one can cheat - smart contracts enforce rules</li>
              <li>✓ True ownership of your in-game assets</li>
              <li>✓ 100% Halal - No gambling, no riba (interest)</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-ink p-4 rounded-b-2xl">
          <button
            onClick={handleDismiss}
            className="w-full py-3 bg-gold hover:bg-gold/90 text-ink font-bold rounded-lg
                     transition-all hover:scale-[1.02]"
          >
            Got it! Let&apos;s Trade! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
