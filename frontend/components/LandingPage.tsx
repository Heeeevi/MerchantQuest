'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

interface LandingPageProps {
  onPlay: () => void;
}

export default function LandingPage({ onPlay }: LandingPageProps) {
  const { isConnected } = useAccount();
  const [showAbout, setShowAbout] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-proceed if already connected
  useEffect(() => {
    if (isConnected && mounted) {
      // Small delay for smooth transition
      const timer = setTimeout(() => onPlay(), 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, mounted, onPlay]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/og-image.jpeg"
          alt="MerchantQuest"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/50 via-transparent to-ink/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center border-2 border-gold">
              <span className="text-2xl">⚔️</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gold">MerchantQuest</h1>
              <p className="text-sm text-parchment/60">Medieval Trading RPG</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="https://sepolia.mantlescan.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-parchment/60 hover:text-gold transition-colors hidden md:block"
            >
              Built on Mantle
            </a>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-2xl">
            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold text-gold mb-4 drop-shadow-2xl">
              
            </h1>
            <p className="text-xl md:text-2xl text-parchment mb-2">
              Medieval Trading RPG on Mantle
            </p>
            <p className="text-parchment/70 mb-8 max-w-md mx-auto">
              Trade commodities, travel between cities, and become the greatest merchant in the realm!
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              {mounted && (
                <div className="transform hover:scale-105 transition-transform">
                  <ConnectButton.Custom>
                    {({ openConnectModal, account }) => (
                      <button
                        onClick={account ? onPlay : openConnectModal}
                        className="px-8 py-4 bg-gradient-to-r from-gold to-bronze text-ink font-bold text-xl 
                                 rounded-lg shadow-lg hover:shadow-gold/50 transition-all
                                 border-2 border-gold hover:border-white
                                 flex items-center gap-3"
                      >
                        <span className="text-2xl">🎮</span>
                        {account ? 'Enter Game' : 'Connect & Play'}
                      </button>
                    )}
                  </ConnectButton.Custom>
                </div>
              )}
              
              <button
                onClick={() => setShowAbout(true)}
                className="px-6 py-3 bg-ink/80 text-parchment font-bold rounded-lg 
                         border-2 border-gold/50 hover:border-gold transition-all
                         hover:bg-ink flex items-center gap-2"
              >
                <span>❓</span>
                What is this?
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { icon: '📈', label: 'Real Prices', desc: 'RWA Oracle' },
                { icon: '🏰', label: '4 Cities', desc: 'Unique markets' },
                { icon: '🎯', label: 'Quests', desc: 'Daily missions' },
                { icon: '☪️', label: '100% Halal', desc: 'No gambling' },
              ].map((feature, idx) => (
                <div 
                  key={idx}
                  className="p-3 bg-ink/60 backdrop-blur-sm rounded-lg border border-gold/30"
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <p className="font-bold text-gold text-sm mt-1">{feature.label}</p>
                  <p className="text-xs text-parchment/60">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center">
          <p className="text-sm text-parchment/40">
            Built for Mantle Global Hackathon 2025 • GameFi Track
          </p>
        </footer>
      </div>

      {/* About Modal */}
      {showAbout && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/90 backdrop-blur-sm"
          onClick={() => setShowAbout(false)}
        >
          <div 
            className="bg-parchment text-ink rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">What is MerchantQuest?</h2>
                <button 
                  onClick={() => setShowAbout(false)}
                  className="text-ink/50 hover:text-ink text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="p-4 bg-gold/20 rounded-lg border-2 border-gold">
                  <h3 className="font-bold text-lg mb-2">🎮 A Medieval Trading Game</h3>
                  <p>
                    MerchantQuest is a blockchain-based trading simulation where you play as a 
                    medieval merchant. Buy commodities cheap in one city, travel to another, 
                    and sell them for profit!
                  </p>
                </div>

                <div className="p-4 bg-blue-100 rounded-lg">
                  <h3 className="font-bold mb-2">🌍 Real World Asset (RWA) Integration</h3>
                  <p>
                    Prices in this game are connected to REAL commodity prices through our oracle. 
                    When real-world gold prices go up, in-game gold prices rise too!
                  </p>
                </div>

                <div className="p-4 bg-green-100 rounded-lg">
                  <h3 className="font-bold mb-2">📚 Learn While Playing</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Supply & Demand dynamics</li>
                    <li>Arbitrage trading strategies</li>
                    <li>Risk management</li>
                    <li>Blockchain & Web3 basics</li>
                  </ul>
                </div>

                <div className="p-4 bg-purple-100 rounded-lg">
                  <h3 className="font-bold mb-2">☪️ 100% Halal</h3>
                  <p>
                    No gambling mechanics, no interest (riba), no loot boxes. 
                    Pure skill-based trading with transparent on-chain transactions.
                  </p>
                </div>

                <div className="p-4 bg-gray-100 rounded-lg">
                  <h3 className="font-bold mb-2">⛓️ Built on Mantle</h3>
                  <p>
                    Powered by Mantle Network - fast, cheap transactions with 
                    Ethereum security. Your merchant NFT and progress are truly yours!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAbout(false)}
                className="w-full mt-6 py-3 bg-gold hover:bg-gold/90 text-ink font-bold rounded-lg transition-all"
              >
                Got it! 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
