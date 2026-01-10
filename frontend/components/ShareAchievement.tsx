'use client';

import { useState, useRef } from 'react';
import { CITIES, COMMODITIES } from '@/lib/config';

interface ShareAchievementProps {
  type: 'trade' | 'level_up' | 'achievement' | 'travel';
  data: {
    merchantName: string;
    level?: number;
    profit?: number;
    commodity?: number;
    quantity?: number;
    buyPrice?: number;
    sellPrice?: number;
    fromCity?: number;
    toCity?: number;
    achievementName?: string;
    achievementIcon?: string;
  };
  onClose: () => void;
}

export default function ShareAchievement({ type, data, onClose }: ShareAchievementProps) {
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const getTitle = () => {
    switch (type) {
      case 'trade':
        return data.profit && data.profit > 0 ? '💰 Profitable Trade!' : '📊 Trade Completed';
      case 'level_up':
        return '⭐ Level Up!';
      case 'achievement':
        return '🏆 Achievement Unlocked!';
      case 'travel':
        return '🗺️ Journey Complete!';
      default:
        return '🎮 MerchantQuest';
    }
  };

  const getGradient = () => {
    if (type === 'trade' && data.profit && data.profit > 0) {
      return 'from-green-900 via-emerald-900 to-teal-900';
    }
    if (type === 'level_up') {
      return 'from-yellow-900 via-amber-900 to-orange-900';
    }
    if (type === 'achievement') {
      return 'from-purple-900 via-indigo-900 to-blue-900';
    }
    return 'from-slate-900 via-gray-900 to-zinc-900';
  };

  const generateShareText = () => {
    let text = `🎮 MerchantQuest on Mantle\n\n`;
    text += `👤 ${data.merchantName}\n`;

    switch (type) {
      case 'trade':
        if (data.commodity !== undefined) {
          const commodity = COMMODITIES[data.commodity];
          text += `\n${getTitle()}\n`;
          text += `${commodity.icon} ${commodity.name}\n`;
          text += `📦 Quantity: ${data.quantity}\n`;
          if (data.profit !== undefined) {
            const profitEmoji = data.profit > 0 ? '📈' : '📉';
            text += `${profitEmoji} ${data.profit > 0 ? 'Profit' : 'Loss'}: ${Math.abs(data.profit).toLocaleString()} Gold\n`;
          }
        }
        break;
      case 'level_up':
        text += `\n⭐ Reached Level ${data.level}!\n`;
        text += `The journey of a master merchant continues...\n`;
        break;
      case 'achievement':
        text += `\n🏆 ${data.achievementName}\n`;
        break;
      case 'travel':
        if (data.fromCity !== undefined && data.toCity !== undefined) {
          text += `\n🗺️ Traveled from ${CITIES[data.fromCity]?.name} to ${CITIES[data.toCity]?.name}\n`;
        }
        break;
    }

    text += `\n#MerchantQuest #Mantle #Web3Gaming`;
    return text;
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generateShareText());
    alert('Copied to clipboard! 📋');
  };

  const downloadShareCard = async () => {
    if (!shareCardRef.current) return;
    setIsGenerating(true);
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#1a1a2e',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `merchantquest-${type}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Failed to generate image:', error);
      alert('Failed to generate image. Please try copying the text instead.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-[#2a1810] to-[#1a0f08] rounded-2xl border-2 border-gold max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gold">📤 Share Achievement</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white text-xl font-bold transition-all"
          >
            ×
          </button>
        </div>

        {/* Share Card Preview */}
        <div 
          ref={shareCardRef}
          className={`bg-gradient-to-br ${getGradient()} rounded-xl p-6 mb-4 relative overflow-hidden`}
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
          
          <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <span className="text-gold font-bold">MerchantQuest</span>
              </div>
              <span className="text-xs text-ink/60 bg-black/20 px-2 py-1 rounded">on Mantle</span>
            </div>

            {/* Title */}
            <div className="text-center mb-4">
              <p className="text-3xl mb-2">{getTitle()}</p>
              <p className="text-lg font-bold text-white">{data.merchantName}</p>
            </div>

            {/* Content based on type */}
            {type === 'trade' && data.commodity !== undefined && (
              <div className="bg-black/30 rounded-lg p-4">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <span className="text-3xl">{COMMODITIES[data.commodity]?.icon}</span>
                  <span className="text-xl font-bold text-white">{COMMODITIES[data.commodity]?.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-400">Quantity</p>
                    <p className="text-lg font-bold text-white">📦 {data.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{data.profit && data.profit > 0 ? 'Profit' : 'Result'}</p>
                    <p className={`text-lg font-bold ${data.profit && data.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {data.profit && data.profit > 0 ? '📈' : '📉'} {data.profit !== undefined ? (data.profit > 0 ? '+' : '') + data.profit.toLocaleString() : '0'} Gold
                    </p>
                  </div>
                </div>
              </div>
            )}

            {type === 'level_up' && (
              <div className="bg-black/30 rounded-lg p-4 text-center">
                <p className="text-6xl mb-2">⭐</p>
                <p className="text-3xl font-bold text-gold">Level {data.level}</p>
                <p className="text-sm text-gray-400 mt-2">The journey continues...</p>
              </div>
            )}

            {type === 'achievement' && (
              <div className="bg-black/30 rounded-lg p-4 text-center">
                <p className="text-5xl mb-2">{data.achievementIcon || '🏆'}</p>
                <p className="text-xl font-bold text-gold">{data.achievementName}</p>
              </div>
            )}

            {type === 'travel' && data.fromCity !== undefined && data.toCity !== undefined && (
              <div className="bg-black/30 rounded-lg p-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl">{CITIES[data.fromCity]?.icon}</p>
                    <p className="text-sm font-bold">{CITIES[data.fromCity]?.name}</p>
                  </div>
                  <span className="text-2xl">→</span>
                  <div className="text-center">
                    <p className="text-2xl">{CITIES[data.toCity]?.icon}</p>
                    <p className="text-sm font-bold">{CITIES[data.toCity]?.name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
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
                     rounded-lg transition-colors border border-[#1DA1F2]/30 text-white"
          >
            <span className="text-xl">𝕏</span>
            <span className="text-sm font-medium">Share on X</span>
          </button>
          
          <button
            onClick={copyToClipboard}
            className="flex items-center justify-center gap-2 p-3 bg-white/10 hover:bg-white/20 
                     rounded-lg transition-colors border border-white/20 text-white"
          >
            <span className="text-xl">📋</span>
            <span className="text-sm font-medium">Copy Text</span>
          </button>
        </div>

        <button
          onClick={downloadShareCard}
          disabled={isGenerating}
          className="w-full mt-3 flex items-center justify-center gap-2 p-3 bg-gold/20 hover:bg-gold/30 
                   rounded-lg transition-colors border border-gold/50 disabled:opacity-50 text-gold font-medium"
        >
          <span className="text-xl">💾</span>
          <span className="text-sm">{isGenerating ? 'Generating...' : 'Save as Image'}</span>
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          Share your trading achievements with the world! 🌍
        </p>
      </div>
    </div>
  );
}
