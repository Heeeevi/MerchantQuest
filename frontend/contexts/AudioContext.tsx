'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface AudioContextType {
  bgmEnabled: boolean;
  setBgmEnabled: (enabled: boolean) => void;
  currentCity: number;
  setCurrentCity: (city: number) => void;
  volume: number;
  setVolume: (vol: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// BGM paths per city
const CITY_BGM: Record<number, string> = {
  0: '/sfx/silverport.mp3',
  1: '/sfx/goldmere.mp3',
  2: '/sfx/silkwind.mp3',
  3: '/sfx/ironhold.mp3',
};

export function AudioProvider({ children }: { children: ReactNode }) {
  const [bgmEnabled, setBgmEnabled] = useState(true); // Default ON
  const [currentCity, setCurrentCity] = useState(0);
  const [volume, setVolume] = useState(0.3);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Listen for first user interaction (required for autoplay)
  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // BGM Effect - plays globally
  useEffect(() => {
    if (!bgmEnabled || !hasInteracted) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    const bgmPath = CITY_BGM[currentCity];
    if (!bgmPath) return;

    // If same track is playing, just adjust volume
    if (audioRef.current && audioRef.current.src.includes(bgmPath.split('/').pop()!)) {
      audioRef.current.volume = volume;
      return;
    }

    // Fade out old, fade in new
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(bgmPath);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    audio.play().catch(err => {
      console.log('BGM autoplay blocked:', err);
    });

    return () => {
      // Don't stop on cleanup - we want persistent BGM
    };
  }, [currentCity, bgmEnabled, hasInteracted, volume]);

  // Volume change effect
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Toggle BGM
  useEffect(() => {
    if (!bgmEnabled && audioRef.current) {
      audioRef.current.pause();
    } else if (bgmEnabled && audioRef.current && hasInteracted) {
      audioRef.current.play().catch(() => {});
    }
  }, [bgmEnabled, hasInteracted]);

  return (
    <AudioContext.Provider value={{ 
      bgmEnabled, 
      setBgmEnabled, 
      currentCity, 
      setCurrentCity,
      volume,
      setVolume
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
