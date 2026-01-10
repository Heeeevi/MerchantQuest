'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { IMAGES } from '@/lib/images';
import Image from 'next/image';
import AudioControls from './AudioControls';

export default function GameHeader() {
  return (
    <header className="bg-ink/80 border-b-2 border-gold/30 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 relative">
            <Image
              src={IMAGES.logo}
              alt="MerchantQuest Logo"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gold">MerchantQuest</h1>
            <p className="text-xs text-parchment/60">Medieval Trading RPG on Mantle</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Global Audio Controls */}
          <AudioControls />
          
          <a 
            href="https://sepolia.mantlescan.xyz" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-parchment/60 hover:text-gold transition-colors hidden sm:block"
          >
            Mantle Sepolia
          </a>
          <ConnectButton 
            showBalance={false}
            chainStatus="icon"
            accountStatus="address"
          />
        </div>
      </div>
    </header>
  );
}
