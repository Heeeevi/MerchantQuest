'use client';

import { useAudio } from '@/contexts/AudioContext';

export default function AudioControls() {
  const { bgmEnabled, setBgmEnabled, volume, setVolume } = useAudio();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setBgmEnabled(!bgmEnabled)}
        className={`px-3 py-2 rounded-lg border-2 transition-all flex items-center gap-2
                  ${bgmEnabled 
                    ? 'bg-gold/20 border-gold text-gold hover:bg-gold/30' 
                    : 'bg-ink/20 border-gold/30 text-parchment/60 hover:border-gold/50'}`}
        title={bgmEnabled ? 'Mute BGM' : 'Enable BGM'}
      >
        <span className="text-lg">{bgmEnabled ? '🔊' : '🔇'}</span>
        <span className="hidden sm:inline text-sm">
          {bgmEnabled ? 'BGM On' : 'BGM Off'}
        </span>
      </button>

      {bgmEnabled && (
        <input
          type="range"
          min="0"
          max="100"
          value={volume * 100}
          onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
          className="w-16 sm:w-24 h-2 bg-gold/30 rounded-lg appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                   [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-gold 
                   [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
          title={`Volume: ${Math.round(volume * 100)}%`}
        />
      )}
    </div>
  );
}
