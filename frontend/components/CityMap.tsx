'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi';
import { GAME_WORLD_ABI, MERCHANT_NFT_ABI } from '@/lib/contracts';
import { CONTRACT_ADDRESSES, CITIES } from '@/lib/config';
import { IMAGES } from '@/lib/images';
import { useAudio } from '@/contexts/AudioContext';
import Image from 'next/image';

interface CityMapProps {
  currentCity: number;
  gold: number;
  onTravel: () => void;
}

// Travel state storage key
const TRAVEL_STATE_KEY = 'merchantquest_travel_state';

interface StoredTravelState {
  merchantId: string;
  selectedCity: number;
  startTime: number;
  travelDuration: number;
  phase: 'traveling' | 'ready_to_complete';
}

export default function CityMap({ currentCity, gold, onTravel }: CityMapProps) {
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [travelPhase, setTravelPhase] = useState<'idle' | 'starting' | 'traveling' | 'completing'>('idle');
  const [travelTimeRemaining, setTravelTimeRemaining] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [stuckTravelDetected, setStuckTravelDetected] = useState(false);
  
  const { address } = useAccount();
  const { setCurrentCity: setAudioCity } = useAudio();

  // Get merchant ID
  const { data: merchantId } = useReadContract({
    address: CONTRACT_ADDRESSES.merchantNFT,
    abi: MERCHANT_NFT_ABI,
    functionName: 'playerMerchant',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // CHECK BLOCKCHAIN TRAVEL STATUS - This detects stuck travel!
  const { data: travelStatus, refetch: refetchTravelStatus } = useReadContract({
    address: CONTRACT_ADDRESSES.gameWorld,
    abi: GAME_WORLD_ABI,
    functionName: 'getTravelStatus',
    args: merchantId ? [merchantId] : undefined,
    query: { enabled: !!merchantId },
  });

  // Detect stuck travel from blockchain
  useEffect(() => {
    if (travelStatus && travelPhase === 'idle') {
      const [isTraveling, fromCity, toCity, timeRemaining] = travelStatus as [boolean, bigint, bigint, bigint];
      
      if (isTraveling) {
        console.log('🚨 Detected stuck travel on blockchain!', { isTraveling, fromCity: Number(fromCity), toCity: Number(toCity), timeRemaining: Number(timeRemaining) });
        setStuckTravelDetected(true);
        setSelectedCity(Number(toCity));
        
        const remaining = Number(timeRemaining);
        if (remaining > 0) {
          setTravelPhase('traveling');
          setTravelTimeRemaining(remaining);
        } else {
          // Ready to complete immediately
          setTravelPhase('completing');
          setTravelTimeRemaining(0);
        }
      }
    }
  }, [travelStatus, travelPhase]);

  // Update BGM when city changes
  useEffect(() => {
    setAudioCity(currentCity);
  }, [currentCity, setAudioCity]);

  // Restore travel state from localStorage on mount
  useEffect(() => {
    if (!merchantId) return;
    
    const stored = localStorage.getItem(TRAVEL_STATE_KEY);
    if (stored) {
      try {
        const state: StoredTravelState = JSON.parse(stored);
        if (state.merchantId === merchantId.toString()) {
          const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
          const remaining = state.travelDuration - elapsed;
          
          if (remaining > 0) {
            setSelectedCity(state.selectedCity);
            setTravelPhase('traveling');
            setTravelTimeRemaining(remaining);
          } else {
            // Travel complete, ready to finalize
            setSelectedCity(state.selectedCity);
            setTravelPhase('completing');
          }
        }
      } catch (e) {
        localStorage.removeItem(TRAVEL_STATE_KEY);
      }
    }
  }, [merchantId]);

  // Start Travel
  const { 
    writeContract: startTravelWrite, 
    data: startHash, 
    isPending: isStartPending,
    error: startError,
    reset: resetStart
  } = useWriteContract();
  
  const { isLoading: isStartConfirming, isSuccess: isStartSuccess } = useWaitForTransactionReceipt({
    hash: startHash,
  });

  // Complete Travel
  const { 
    writeContract: completeTravelWrite, 
    data: completeHash, 
    isPending: isCompletePending,
    error: completeError,
    reset: resetComplete
  } = useWriteContract();
  
  const { isLoading: isCompleteConfirming, isSuccess: isCompleteSuccess } = useWaitForTransactionReceipt({
    hash: completeHash,
  });

  // Handle errors
  useEffect(() => {
    if (startError) {
      console.error('Start travel error:', startError);
      setError('Failed to start travel. Please try again.');
      setTravelPhase('idle');
      setSelectedCity(null);
      localStorage.removeItem(TRAVEL_STATE_KEY);
    }
    if (completeError) {
      console.error('Complete travel error:', completeError);
      setError('Failed to complete travel. Please try again.');
      setTravelPhase('idle');
      setSelectedCity(null);
      localStorage.removeItem(TRAVEL_STATE_KEY);
    }
  }, [startError, completeError]);

  // Travel times - REDUCED for better UX (5-10 seconds)
  const travelTimes: Record<number, Record<number, number>> = {
    0: { 1: 5, 2: 8, 3: 6 },   // From Silverport
    1: { 0: 5, 2: 10, 3: 7 },  // From Goldmere
    2: { 0: 8, 1: 10, 3: 7 },  // From Silkwind
    3: { 0: 6, 1: 7, 2: 7 },   // From Ironhold
  };

  const getTravelTime = (from: number, to: number) => {
    return travelTimes[from]?.[to] || 5;
  };

  // Handle start travel success
  useEffect(() => {
    if (isStartSuccess && selectedCity !== null && merchantId) {
      const duration = getTravelTime(currentCity, selectedCity);
      
      // Store travel state
      const travelState: StoredTravelState = {
        merchantId: merchantId.toString(),
        selectedCity,
        startTime: Date.now(),
        travelDuration: duration,
        phase: 'traveling',
      };
      localStorage.setItem(TRAVEL_STATE_KEY, JSON.stringify(travelState));
      
      setTravelPhase('traveling');
      setTravelTimeRemaining(duration);
      setError(null);
    }
  }, [isStartSuccess, selectedCity, merchantId, currentCity]);

  // Countdown timer
  useEffect(() => {
    if (travelPhase !== 'traveling' || travelTimeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTravelTimeRemaining(prev => {
        if (prev <= 1) {
          setTravelPhase('completing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [travelPhase, travelTimeRemaining]);

  // Auto-complete travel
  const handleCompleteTravel = useCallback(() => {
    completeTravelWrite({
      address: CONTRACT_ADDRESSES.gameWorld,
      abi: GAME_WORLD_ABI,
      functionName: 'completeTravel',
      args: [],
    });
  }, [completeTravelWrite]);

  useEffect(() => {
    if (travelPhase === 'completing' && !isCompletePending && !isCompleteConfirming) {
      handleCompleteTravel();
    }
  }, [travelPhase, isCompletePending, isCompleteConfirming, handleCompleteTravel]);

  // Handle complete success
  useEffect(() => {
    if (isCompleteSuccess) {
      localStorage.removeItem(TRAVEL_STATE_KEY);
      setTravelPhase('idle');
      setSelectedCity(null);
      setError(null);
      setStuckTravelDetected(false); // Clear stuck flag
      resetStart();
      resetComplete();
      refetchTravelStatus(); // Refresh travel status from blockchain
      onTravel();
    }
  }, [isCompleteSuccess, onTravel, resetStart, resetComplete, refetchTravelStatus]);

  const handleStartTravel = (cityId: number) => {
    if (cityId === currentCity) return;
    setError(null);
    
    setSelectedCity(cityId);
    setTravelPhase('starting');
    
    startTravelWrite({
      address: CONTRACT_ADDRESSES.gameWorld,
      abi: GAME_WORLD_ABI,
      functionName: 'startTravel',
      args: [BigInt(cityId)],
    });
  };

  const handleCancelTravel = () => {
    localStorage.removeItem(TRAVEL_STATE_KEY);
    setTravelPhase('idle');
    setSelectedCity(null);
    setError(null);
    resetStart();
    resetComplete();
  };

  // City positions
  const cityPositions = [
    { top: '55%', left: '50%' },
    { top: '20%', left: '25%' },
    { top: '25%', left: '75%' },
    { top: '70%', left: '75%' },
  ];

  const travelCosts = [0, 60, 80, 70];

  const isProcessing = isStartPending || isStartConfirming || isCompletePending || isCompleteConfirming || travelPhase === 'traveling' || travelPhase === 'completing';

  return (
    <div className="card-medieval">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gold">🗺️ World Map</h2>
          <p className="text-sm">Click on a city to travel there.</p>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[400px] md:h-[500px] rounded-xl border-2 border-gold/30 overflow-hidden">
        {/* Map Background */}
        <div className="absolute inset-0">
          <Image
            src="/images/textures/map.jpeg"
            alt="World Map"
            fill
            className="object-cover opacity-70"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ink/30" />
        </div>

        {/* Trade Routes */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          {CITIES.map((city, idx) => {
            if (idx === currentCity) return null;
            const from = cityPositions[currentCity];
            const to = cityPositions[idx];
            return (
              <line
                key={`route-${idx}`}
                x1={from.left}
                y1={from.top}
                x2={to.left}
                y2={to.top}
                stroke="#d4af37"
                strokeWidth="2"
                strokeDasharray="8,4"
                opacity="0.5"
              />
            );
          })}
        </svg>

        {/* Cities */}
        {CITIES.map((city, idx) => {
          const pos = cityPositions[idx];
          const isCurrentCity = idx === currentCity;
          const canAfford = gold >= travelCosts[idx];
          const isSelected = selectedCity === idx;
          
          return (
            <div
              key={city.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10
                        transition-all duration-300 cursor-pointer
                        ${isCurrentCity ? 'scale-110' : 'hover:scale-105'}
                        ${isSelected && isProcessing ? 'animate-pulse' : ''}`}
              style={{ top: pos.top, left: pos.left }}
              onClick={() => !isCurrentCity && canAfford && !isProcessing && handleStartTravel(idx)}
            >
              <div className="relative group">
                {isCurrentCity && (
                  <div className="absolute inset-0 bg-gold rounded-lg blur-xl opacity-50 animate-pulse" />
                )}
                
                <div className={`relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden
                              border-4 transition-all shadow-lg
                              ${isCurrentCity 
                                ? 'border-gold shadow-gold-glow' 
                                : canAfford
                                  ? 'border-gold/50 hover:border-gold hover:shadow-gold-glow'
                                  : 'border-red-500/50 opacity-60'
                              }`}
                >
                  <Image
                    src={IMAGES.getCityImage(idx)}
                    alt={city.name}
                    fill
                    className="object-cover"
                  />
                  {!isCurrentCity && (
                    <div className="absolute inset-0 bg-ink/20 hover:bg-transparent transition-all" />
                  )}
                </div>

                <div className={`absolute -bottom-14 left-1/2 transform -translate-x-1/2 
                              text-center whitespace-nowrap
                              ${isCurrentCity ? 'text-gold' : 'text-parchment'}`}>
                  <p className="font-bold text-sm drop-shadow-lg">{city.name}</p>
                  {!isCurrentCity && (
                    <p className={`text-xs ${canAfford ? 'text-parchment/80' : 'text-red-400'}`}>
                      💰 {travelCosts[idx]} • ⏱️ {getTravelTime(currentCity, idx)}s
                    </p>
                  )}
                  {isCurrentCity && (
                    <p className="text-xs text-gold">📍 You are here</p>
                  )}
                </div>

                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                              opacity-0 group-hover:opacity-100 transition-opacity
                              bg-ink/95 text-parchment px-3 py-2 rounded-lg text-sm
                              whitespace-nowrap pointer-events-none z-20 border border-gold/30">
                  <p className="font-bold">{city.name}</p>
                  <p className="text-xs text-parchment/70">{city.specialty}</p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Error Message */}
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 
                        bg-red-900/90 border border-red-500 text-white px-4 py-2 rounded-lg">
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-xs underline mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stuck Travel Alert */}
        {stuckTravelDetected && travelPhase === 'idle' && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 
                        bg-yellow-900/90 border border-yellow-500 text-white px-4 py-3 rounded-lg max-w-sm">
            <p className="text-sm font-bold mb-1">⚠️ Incomplete Travel Detected</p>
            <p className="text-xs">You have an unfinished journey. Click the map to complete it!</p>
          </div>
        )}

        {/* Travel Overlay */}
        {isProcessing && selectedCity !== null && (
          <div className="absolute inset-0 bg-ink/60 flex items-center justify-center z-20">
            <div className="bg-ink/95 border-2 border-gold rounded-xl p-8 text-center max-w-sm">
              <p className="text-5xl mb-4">
                {travelPhase === 'starting' || isStartPending ? '📜' : 
                 travelPhase === 'traveling' ? '🐎' : '🏁'}
              </p>
              <p className="text-gold font-bold text-xl mb-2">
                {stuckTravelDetected ? 'Resuming journey...' :
                 isStartPending ? 'Confirm in wallet...' : 
                 isStartConfirming ? 'Starting journey...' :
                 travelPhase === 'traveling' ? 'Traveling...' :
                 isCompletePending ? 'Confirm arrival...' :
                 isCompleteConfirming ? 'Arriving...' : 'Processing...'}
              </p>
              <p className="text-parchment/80 mb-4">
                Heading to {CITIES[selectedCity]?.name}
              </p>
              
              {travelPhase === 'traveling' && travelTimeRemaining > 0 && (
                <div className="mt-4">
                  <div className="w-full h-3 bg-ink/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-gold to-bronze transition-all duration-1000"
                      style={{ 
                        width: `${((getTravelTime(currentCity, selectedCity) - travelTimeRemaining) / getTravelTime(currentCity, selectedCity)) * 100}%` 
                      }}
                    />
                  </div>
                  <p className="text-2xl font-bold text-gold mt-2">{travelTimeRemaining}s</p>
                  <p className="text-xs text-parchment/60">until arrival</p>
                </div>
              )}

              {/* Cancel button for stuck states */}
              <button
                onClick={handleCancelTravel}
                className="mt-4 text-xs text-parchment/50 hover:text-parchment underline"
              >
                Cancel (if stuck)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* City Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {CITIES.map((city, idx) => {
          const isCurrentCity = idx === currentCity;
          const travelTime = getTravelTime(currentCity, idx);
          return (
            <div 
              key={city.id}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer
                        ${isCurrentCity 
                          ? 'bg-gold/20 border-gold' 
                          : 'bg-ink/20 border-gold/20 hover:border-gold/50'}`}
              onClick={() => !isCurrentCity && gold >= travelCosts[idx] && !isProcessing && handleStartTravel(idx)}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                  <Image src={IMAGES.getCityImage(idx)} alt={city.name} fill className="object-cover" />
                </div>
                <div>
                  <span className="font-bold">{city.name}</span>
                  {isCurrentCity && <span className="ml-2 text-xs bg-gold text-ink px-2 py-0.5 rounded">HERE</span>}
                </div>
              </div>
              <p className="text-xs text-ink/70">{city.description}</p>
              <p className="text-xs text-gold mt-1">✨ {city.specialty}</p>
              {!isCurrentCity && (
                <p className="text-xs text-ink/50 mt-1">💰 {travelCosts[idx]} gold • ⏱️ {travelTime}s</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
