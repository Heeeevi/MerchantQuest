'use client';

import { useState, useRef } from 'react';
import { CITIES } from '@/lib/config';

interface QuickShareProps {
  merchantName: string;
  level: number;
  gold: number;
  totalProfit: number;
  totalTrades: number;
  currentCity: number;
}

export default function QuickShare({
  merchantName,
  level,
  gold,
  totalProfit,
  totalTrades,
  currentCity,
}: QuickShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const generateShareText = () => {
    return `🏆 MerchantQuest Profile\n\n` +
           `👤 ${merchantName}\n` +
           `⭐ Level: ${level}\n` +
           `📍 Location: ${CITIES[currentCity]?.name || 'Unknown'}\n` +
           `💰 Gold: ${gold.toLocaleString()}\n` +
           `📈 Total Profit: ${totalProfit.toLocaleString()}\n` +
           `⚖️ Total Trades: ${totalTrades}\n\n` +
           `🎮 Play MerchantQuest on Mantle!\n` +
           `#MerchantQuest #Mantle #Web3Gaming`;
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    setIsOpen(false);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generateShareText());
    alert('Copied to clipboard! 📋');
    setIsOpen(false);
  };

  const downloadImage = async () => {
    if (!shareCardRef.current) return;
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#1a1a2e',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `merchantquest-${merchantName}-profile.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Failed to generate image:', error);
      copyToClipboard();
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Share Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full 
                 bg-gradient-to-r from-blue-500 to-purple-500 
                 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50
                 flex items-center justify-center text-2xl
                 hover:scale-110 transition-all duration-200"
        title="Share your profile"
      >
        📤
      </button>

      {/* Share Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-ink to-ink/95 rounded-2xl border-2 border-gold max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gold">📤 Share Profile</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-ink/60 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Profile Card Preview */}
            <div 
              ref={shareCardRef}
              className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 rounded-xl p-6 mb-4 relative overflow-hidden"
            >
              {/* Decorations */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gold/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
              
              <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    <span className="text-gold font-bold text-lg">MerchantQuest</span>
                  </div>
                  <span className="text-xs text-ink/60 bg-black/20 px-2 py-1 rounded">on Mantle</span>
                </div>

                {/* Merchant Info */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-gold to-bronze 
                              border-4 border-gold/50 flex items-center justify-center text-4xl">
                    🧙
                  </div>
                  <p className="text-2xl font-bold text-white">{merchantName}</p>
                  <p className="text-gold flex items-center justify-center gap-2">
                    <span>⭐ Level {level}</span>
                    <span>•</span>
                    <span>{CITIES[currentCity]?.icon} {CITIES[currentCity]?.name}</span>
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-400">💰</p>
                    <p className="text-lg font-bold">{gold.toLocaleString()}</p>
                    <p className="text-xs text-ink/60">Gold</p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">📈</p>
                    <p className="text-lg font-bold">{totalProfit.toLocaleString()}</p>
                    <p className="text-xs text-ink/60">Profit</p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-400">⚖️</p>
                    <p className="text-lg font-bold">{totalTrades}</p>
                    <p className="text-xs text-ink/60">Trades</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-ink/60">
                  <span>Built on Mantle</span>
                  <span>#MerchantQuest</span>
                </div>
              </div>
            </div>

            {/* Share Actions */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={shareToTwitter}
                className="flex flex-col items-center gap-2 p-4 bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 
                         rounded-xl transition-colors border border-[#1DA1F2]/30"
              >
                <span className="text-2xl">𝕏</span>
                <span className="text-xs">Twitter</span>
              </button>
              
              <button
                onClick={copyToClipboard}
                className="flex flex-col items-center gap-2 p-4 bg-gray-500/20 hover:bg-gray-500/30 
                         rounded-xl transition-colors border border-gray-500/30"
              >
                <span className="text-2xl">📋</span>
                <span className="text-xs">Copy</span>
              </button>
              
              <button
                onClick={downloadImage}
                className="flex flex-col items-center gap-2 p-4 bg-green-500/20 hover:bg-green-500/30 
                         rounded-xl transition-colors border border-green-500/30"
              >
                <span className="text-2xl">💾</span>
                <span className="text-xs">Save</span>
              </button>
            </div>

            <p className="text-center text-xs text-ink/50 mt-4">
              Show off your merchant journey! 🌍
            </p>
          </div>
        </div>
      )}
    </>
  );
}
