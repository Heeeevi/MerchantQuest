'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi';
import { GAME_WORLD_ABI, MERCHANT_NFT_ABI } from '@/lib/contracts';
import { CONTRACT_ADDRESSES, CITIES, COMMODITIES } from '@/lib/config';
import { IMAGES } from '@/lib/images';
import { useAudio } from '@/contexts/AudioContext';
import Image from 'next/image';
import ShareAchievement from './ShareAchievement';

interface WorldMapProps {
  currentCity: number;
  gold: number;
  onTravel: () => void;
  onTrade: () => void;
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

interface LastTrade {
  type: 'buy' | 'sell';
  commodity: number;
  quantity: number;
  profit?: number;
}

export default function WorldMap({ currentCity, gold, onTravel, onTrade }: WorldMapProps) {
  // View states
  const [viewMode, setViewMode] = useState<'world' | 'city'>('world');
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  
  // Travel states
  const [travelPhase, setTravelPhase] = useState<'idle' | 'starting' | 'traveling' | 'completing'>('idle');
  const [travelTimeRemaining, setTravelTimeRemaining] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [stuckTravelDetected, setStuckTravelDetected] = useState(false);
  
  // Trade states
  const [selectedCommodity, setSelectedCommodity] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [showShareModal, setShowShareModal] = useState(false);
  const [lastTrade, setLastTrade] = useState<LastTrade | null>(null);
  
  // Hover state for price preview
  const [hoveredCity, setHoveredCity] = useState<number | null>(null);
  
  const { address } = useAccount();
  const { setCurrentCity: setAudioCity } = useAudio();

  // Get merchant data
  const { data: merchantId } = useReadContract({
    address: CONTRACT_ADDRESSES.merchantNFT,
    abi: MERCHANT_NFT_ABI,
    functionName: 'playerMerchant',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: merchantData } = useReadContract({
    address: CONTRACT_ADDRESSES.merchantNFT,
    abi: MERCHANT_NFT_ABI,
    functionName: 'getMerchantByPlayer',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const merchantName = merchantData 
    ? (merchantData as unknown as [bigint, { name: string }])[1]?.name 
    : 'Merchant';

  // Travel status from blockchain
  const { data: travelStatus, refetch: refetchTravelStatus } = useReadContract({
    address: CONTRACT_ADDRESSES.gameWorld,
    abi: GAME_WORLD_ABI,
    functionName: 'getTravelStatus',
    args: merchantId ? [merchantId] : undefined,
    query: { enabled: !!merchantId },
  });

  // City prices for current city
  const { data: pricesData, refetch: refetchPrices } = useReadContract({
    address: CONTRACT_ADDRESSES.gameWorld,
    abi: GAME_WORLD_ABI,
    functionName: 'getAllCityPrices',
    args: [BigInt(currentCity)],
  });

  // Player inventory
  const { data: inventoryData } = useReadContract({
    address: CONTRACT_ADDRESSES.gameWorld,
    abi: GAME_WORLD_ABI,
    functionName: 'getInventory',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Travel contracts
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

  // Trade contract
  const { writeContract: tradeWrite, data: tradeHash, isPending: isTradePending } = useWriteContract();
  const { isLoading: isTradeConfirming, isSuccess: isTradeSuccess } = useWaitForTransactionReceipt({
    hash: tradeHash,
  });

  // Detect stuck travel from blockchain
  useEffect(() => {
    if (travelStatus && travelPhase === 'idle') {
      const [isTraveling, , toCity, timeRemaining] = travelStatus as [boolean, bigint, bigint, bigint];
      
      if (isTraveling) {
        setStuckTravelDetected(true);
        setSelectedCityId(Number(toCity));
        
        const remaining = Number(timeRemaining);
        if (remaining > 0) {
          setTravelPhase('traveling');
          setTravelTimeRemaining(remaining);
        } else {
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

  // Handle errors
  useEffect(() => {
    if (startError) {
      setError(startError.message.includes('user rejected') ? 'Transaction cancelled' : 'Travel failed');
      setTravelPhase('idle');
      localStorage.removeItem(TRAVEL_STATE_KEY);
    }
    if (completeError) {
      setError('Failed to complete travel');
      setTravelPhase('idle');
      localStorage.removeItem(TRAVEL_STATE_KEY);
    }
  }, [startError, completeError]);

  // Travel times - SHORT for better UX (5-10 seconds)
  const travelTimes: Record<number, Record<number, number>> = {
    0: { 1: 5, 2: 8, 3: 6 },
    1: { 0: 5, 2: 10, 3: 7 },
    2: { 0: 8, 1: 10, 3: 7 },
    3: { 0: 6, 1: 7, 2: 7 },
  };

  const getTravelTime = (from: number, to: number) => travelTimes[from]?.[to] || 5;

  // Handle start travel success
  useEffect(() => {
    if (isStartSuccess && selectedCityId !== null && merchantId) {
      const duration = getTravelTime(currentCity, selectedCityId);
      
      const travelState: StoredTravelState = {
        merchantId: merchantId.toString(),
        selectedCity: selectedCityId,
        startTime: Date.now(),
        travelDuration: duration,
        phase: 'traveling',
      };
      localStorage.setItem(TRAVEL_STATE_KEY, JSON.stringify(travelState));
      
      setTravelPhase('traveling');
      setTravelTimeRemaining(duration);
      setError(null);
    }
  }, [isStartSuccess, selectedCityId, merchantId, currentCity]);

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

  // Handle travel complete success
  useEffect(() => {
    if (isCompleteSuccess) {
      localStorage.removeItem(TRAVEL_STATE_KEY);
      setTravelPhase('idle');
      setSelectedCityId(null);
      setError(null);
      setStuckTravelDetected(false);
      setViewMode('world');
      resetStart();
      resetComplete();
      refetchTravelStatus();
      onTravel();
    }
  }, [isCompleteSuccess, onTravel, resetStart, resetComplete, refetchTravelStatus]);

  // Handle trade success
  useEffect(() => {
    if (isTradeSuccess && selectedCommodity !== null) {
      const sellPrice = Number(sellPrices[selectedCommodity] || 0);
      const buyPrice = Number(buyPrices[selectedCommodity] || 0);
      const profit = tradeType === 'sell' 
        ? Math.floor((sellPrice - buyPrice * 0.9) * quantity)
        : undefined;

      setLastTrade({
        type: tradeType,
        commodity: selectedCommodity,
        quantity,
        profit,
      });

      setTimeout(() => {
        onTrade();
        refetchPrices();
        if (tradeType === 'sell' && profit && profit > 0) {
          setShowShareModal(true);
        }
        setSelectedCommodity(null);
        setQuantity(1);
      }, 1000);
    }
  }, [isTradeSuccess]);

  const handleStartTravel = (cityId: number) => {
    if (cityId === currentCity) return;
    setError(null);
    setSelectedCityId(cityId);
    setTravelPhase('starting');
    
    startTravelWrite({
      address: CONTRACT_ADDRESSES.gameWorld,
      abi: GAME_WORLD_ABI,
      functionName: 'startTravel',
      args: [BigInt(cityId)],
    });
  };

  const handleTrade = () => {
    if (selectedCommodity === null) return;

    tradeWrite({
      address: CONTRACT_ADDRESSES.gameWorld,
      abi: GAME_WORLD_ABI,
      functionName: tradeType === 'buy' ? 'buy' : 'sell',
      args: [BigInt(selectedCommodity), BigInt(quantity)],
    });
  };

  const handleCancelTravel = () => {
    localStorage.removeItem(TRAVEL_STATE_KEY);
    setTravelPhase('idle');
    setSelectedCityId(null);
    setError(null);
    resetStart();
    resetComplete();
  };

  const openCityView = (cityId: number) => {
    setSelectedCityId(cityId);
    setViewMode('city');
    setSelectedCommodity(null);
    setQuantity(1);
  };

  // City positions for isometric view
  const cityPositions = [
    { top: '55%', left: '50%' },  // Silverport - center bottom
    { top: '20%', left: '25%' },  // Goldmere - top left
    { top: '25%', left: '75%' },  // Silkwind - top right
    { top: '70%', left: '75%' },  // Ironhold - bottom right
  ];

  const travelCosts = [0, 60, 80, 70];

  const buyPrices = pricesData?.[0] || [];
  const sellPrices = pricesData?.[1] || [];
  const inventory = inventoryData?.[0] || [];

  const isProcessing = isStartPending || isStartConfirming || isCompletePending || isCompleteConfirming || 
                       travelPhase === 'traveling' || travelPhase === 'completing';
  const isTradingProcessing = isTradePending || isTradeConfirming;

  const getMaxQuantity = (commodityId: number) => {
    if (tradeType === 'buy') {
      const price = Number(buyPrices[commodityId] || 0);
      if (price === 0) return 0;
      return Math.floor(gold / price);
    }
    return Number(inventory[commodityId] || 0);
  };

  const getTotalCost = () => {
    if (selectedCommodity === null) return 0;
    const price = tradeType === 'buy' 
      ? Number(buyPrices[selectedCommodity] || 0)
      : Number(sellPrices[selectedCommodity] || 0);
    return price * quantity;
  };

  // =====================
  // RENDER: World Map View
  // =====================
  if (viewMode === 'world') {
    return (
      <div className="card-medieval relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gold">🗺️ The Realm</h2>
            <p className="text-sm text-parchment/70">
              📍 You are in <span className="text-gold font-bold">{CITIES[currentCity]?.name}</span>
              {' '}- Click your city to trade, or another city to travel
            </p>
          </div>
          <div className="text-right">
            <p className="text-gold font-bold text-xl">💰 {gold.toLocaleString()}</p>
            <p className="text-xs text-parchment/60">Gold</p>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative w-full h-[450px] md:h-[550px] rounded-xl border-2 border-gold/30 overflow-hidden">
          {/* Map Background */}
          <div className="absolute inset-0">
            <Image
              src="/images/textures/map.jpeg"
              alt="World Map"
              fill
              className="object-cover opacity-70"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink/50" />
          </div>

          {/* Trade Routes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            {CITIES.map((_, idx) => {
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
                  opacity="0.4"
                />
              );
            })}
          </svg>

          {/* Cities */}
          {CITIES.map((city, idx) => {
            const pos = cityPositions[idx];
            const isCurrentCity = idx === currentCity;
            const canAfford = gold >= travelCosts[idx];
            const isHovered = hoveredCity === idx;
            
            return (
              <div
                key={city.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10
                          transition-all duration-300 cursor-pointer
                          ${isCurrentCity ? 'scale-110' : 'hover:scale-110'}
                          ${isProcessing && selectedCityId === idx ? 'animate-pulse' : ''}`}
                style={{ top: pos.top, left: pos.left }}
                onClick={() => {
                  if (isCurrentCity) {
                    openCityView(idx);
                  } else if (canAfford && !isProcessing) {
                    handleStartTravel(idx);
                  }
                }}
                onMouseEnter={() => setHoveredCity(idx)}
                onMouseLeave={() => setHoveredCity(null)}
              >
                <div className="relative group">
                  {/* Current city glow */}
                  {isCurrentCity && (
                    <div className="absolute inset-0 bg-gold rounded-xl blur-xl opacity-60 animate-pulse" />
                  )}
                  
                  {/* City Image */}
                  <div className={`relative w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden
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
                    
                    {/* Current city indicator */}
                    {isCurrentCity && (
                      <div className="absolute top-1 right-1 px-2 py-0.5 bg-gold text-ink text-xs font-bold rounded">
                        📍 HERE
                      </div>
                    )}
                    
                    {/* Click to trade indicator for current city */}
                    {isCurrentCity && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white font-bold text-sm">🏪 TRADE</span>
                      </div>
                    )}
                  </div>

                  {/* City Name */}
                  <div className="text-center mt-2">
                    <p className={`font-bold text-sm ${isCurrentCity ? 'text-gold' : 'text-parchment'}`}>
                      {city.icon} {city.name}
                    </p>
                    {!isCurrentCity && (
                      <p className={`text-xs ${canAfford ? 'text-gold/70' : 'text-red-400'}`}>
                        🚶 {travelCosts[idx]} gold • {getTravelTime(currentCity, idx)}s
                      </p>
                    )}
                  </div>

                  {/* Hover tooltip with prices */}
                  {isHovered && !isCurrentCity && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 
                                  bg-ink/95 border border-gold/50 rounded-lg p-3 min-w-[200px] z-50
                                  shadow-xl">
                      <p className="text-gold font-bold mb-2">{city.specialty}</p>
                      <p className="text-xs text-parchment/70">{city.description}</p>
                      {!canAfford && (
                        <p className="text-red-400 text-xs mt-2">❌ Not enough gold to travel</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Travel Animation Overlay */}
          {(travelPhase === 'traveling' || travelPhase === 'completing') && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30">
              <div className="bg-ink/90 border-2 border-gold rounded-xl p-8 text-center max-w-md">
                <div className="text-6xl mb-4 animate-bounce">🚢</div>
                <h3 className="text-xl font-bold text-gold mb-2">
                  Traveling to {CITIES[selectedCityId || 0]?.name}...
                </h3>
                <p className="text-parchment/70 mb-4">
                  Your merchant is on the way!
                </p>
                
                {travelPhase === 'traveling' && travelTimeRemaining > 0 && (
                  <div>
                    <div className="w-full h-4 bg-ink/50 rounded-full overflow-hidden mb-2">
                      <div 
                        className="h-full bg-gradient-to-r from-gold to-bronze transition-all duration-1000"
                        style={{ 
                          width: `${((getTravelTime(currentCity, selectedCityId || 0) - travelTimeRemaining) / getTravelTime(currentCity, selectedCityId || 0)) * 100}%` 
                        }}
                      />
                    </div>
                    <p className="text-3xl font-bold text-gold">{travelTimeRemaining}s</p>
                  </div>
                )}

                {travelPhase === 'completing' && (
                  <p className="text-gold animate-pulse">⏳ Arriving...</p>
                )}

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

        {/* Quick Actions */}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => openCityView(currentCity)}
            className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg 
                     font-bold hover:from-green-500 hover:to-green-600 transition-all shadow-lg"
          >
            🏪 Enter {CITIES[currentCity]?.name} Market
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
            ❌ {error}
          </div>
        )}
      </div>
    );
  }

  // =====================
  // RENDER: City View (Marketplace)
  // =====================
  return (
    <div className="card-medieval relative">
      {/* City Header with Back button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewMode('world')}
            className="p-2 rounded-lg bg-ink/30 hover:bg-ink/50 transition-colors"
          >
            ← Back
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gold">
              {CITIES[selectedCityId || currentCity]?.icon} {CITIES[selectedCityId || currentCity]?.name} Market
            </h2>
            <p className="text-sm text-parchment/70">
              {selectedCityId === currentCity 
                ? "You're here! Buy and sell goods." 
                : `Travel here to trade (${travelCosts[selectedCityId || 0]} gold)`
              }
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gold font-bold text-xl">💰 {gold.toLocaleString()}</p>
          <p className="text-xs text-parchment/60">Your Gold</p>
        </div>
      </div>

      {/* City Background Image */}
      <div className="relative h-48 md:h-64 rounded-xl overflow-hidden mb-6 border-2 border-gold/30">
        <Image
          src={IMAGES.getCityImage(selectedCityId || currentCity)}
          alt={CITIES[selectedCityId || currentCity]?.name || ''}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
        
        {/* City Info Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-3xl font-bold text-white mb-1">
            {CITIES[selectedCityId || currentCity]?.name}
          </h3>
          <p className="text-parchment/80 text-sm">
            {CITIES[selectedCityId || currentCity]?.description}
          </p>
          <p className="text-gold text-sm mt-1">
            ✨ Specialty: {CITIES[selectedCityId || currentCity]?.specialty}
          </p>
        </div>
      </div>

      {/* Only show marketplace if this is current city */}
      {selectedCityId === currentCity ? (
        <>
          {/* Trade Type Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setTradeType('buy'); setSelectedCommodity(null); setQuantity(1); }}
              className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                tradeType === 'buy'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-ink/30 text-parchment/70 hover:bg-ink/40'
              }`}
            >
              💰 Buy Goods
            </button>
            <button
              onClick={() => { setTradeType('sell'); setSelectedCommodity(null); setQuantity(1); }}
              className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                tradeType === 'sell'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-ink/30 text-parchment/70 hover:bg-ink/40'
              }`}
            >
              📤 Sell Goods
            </button>
          </div>

          {/* Commodities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {COMMODITIES.map((commodity) => {
              const buyPrice = Number(buyPrices[commodity.id] || 0);
              const sellPrice = Number(sellPrices[commodity.id] || 0);
              const owned = Number(inventory[commodity.id] || 0);
              const isSelected = selectedCommodity === commodity.id;
              const canTrade = tradeType === 'buy' ? gold >= buyPrice : owned > 0;

              return (
                <div
                  key={commodity.id}
                  onClick={() => canTrade && setSelectedCommodity(commodity.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all
                            ${isSelected 
                              ? 'border-gold bg-gold/20 shadow-gold-glow scale-105' 
                              : canTrade
                                ? 'border-gold/30 bg-ink/20 hover:border-gold/60 hover:scale-102'
                                : 'border-red-500/30 bg-ink/10 opacity-50 cursor-not-allowed'
                            }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden">
                      <Image
                        src={IMAGES.getCommodityImage(commodity.id)}
                        alt={commodity.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{commodity.name}</h3>
                      <p className="text-xs text-parchment/60">Owned: {owned}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className={`p-2 rounded ${tradeType === 'buy' ? 'bg-green-600/20 border border-green-500/30' : 'bg-ink/10'}`}>
                      <p className="text-xs text-parchment/60">Buy</p>
                      <p className="font-bold text-green-400">💰 {buyPrice}</p>
                    </div>
                    <div className={`p-2 rounded ${tradeType === 'sell' ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-ink/10'}`}>
                      <p className="text-xs text-parchment/60">Sell</p>
                      <p className="font-bold text-blue-400">💰 {sellPrice}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trade Panel */}
          {selectedCommodity !== null && (
            <div className="bg-gradient-to-r from-ink/40 to-ink/20 rounded-xl p-6 border-2 border-gold/30">
              <h3 className="font-bold text-xl mb-4 text-gold">
                {tradeType === 'buy' ? '💰 Buy' : '📤 Sell'} {COMMODITIES[selectedCommodity]?.name}
              </h3>

              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm text-parchment/60 mb-2 block">Quantity</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-12 rounded-lg bg-ink/50 hover:bg-ink/70 transition-colors text-xl font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(getMaxQuantity(selectedCommodity), parseInt(e.target.value) || 1)))}
                      className="w-24 h-12 text-center rounded-lg bg-ink/30 border border-gold/30 text-xl font-bold"
                      min={1}
                      max={getMaxQuantity(selectedCommodity)}
                    />
                    <button
                      onClick={() => setQuantity(Math.min(getMaxQuantity(selectedCommodity), quantity + 1))}
                      className="w-12 h-12 rounded-lg bg-ink/50 hover:bg-ink/70 transition-colors text-xl font-bold"
                    >
                      +
                    </button>
                    <button
                      onClick={() => setQuantity(getMaxQuantity(selectedCommodity))}
                      className="px-4 h-12 rounded-lg bg-gold/20 text-gold font-bold hover:bg-gold/30 transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                  <p className="text-xs text-parchment/50 mt-1">Max: {getMaxQuantity(selectedCommodity)} units</p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-parchment/60">Total {tradeType === 'buy' ? 'Cost' : 'Revenue'}</p>
                  <p className="text-3xl font-bold text-gold">💰 {getTotalCost().toLocaleString()}</p>
                </div>
              </div>

              <button
                onClick={handleTrade}
                disabled={isTradingProcessing || quantity < 1}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  tradeType === 'buy'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
              >
                {isTradePending ? '⏳ Confirm in Wallet...' :
                 isTradeConfirming ? '⛏️ Processing...' :
                 isTradeSuccess ? '✅ Trade Complete!' :
                 tradeType === 'buy' 
                   ? `💰 Buy ${quantity} ${COMMODITIES[selectedCommodity]?.name}`
                   : `📤 Sell ${quantity} ${COMMODITIES[selectedCommodity]?.name}`
                }
              </button>
            </div>
          )}

          {/* Trading Tips */}
          <div className="mt-6 p-4 bg-ink/10 rounded-lg border border-gold/20">
            <h4 className="font-bold text-gold mb-2">💡 {CITIES[currentCity]?.name} Trading Tips</h4>
            <p className="text-sm text-parchment/80">{CITIES[currentCity]?.specialty}</p>
          </div>
        </>
      ) : (
        /* Not in this city - show travel option */
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚢</div>
          <h3 className="text-xl font-bold text-gold mb-2">Travel Required</h3>
          <p className="text-parchment/70 mb-6">
            You need to travel to {CITIES[selectedCityId || 0]?.name} to trade here.
          </p>
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => handleStartTravel(selectedCityId || 0)}
              disabled={gold < travelCosts[selectedCityId || 0] || isProcessing}
              className="px-8 py-4 bg-gradient-to-r from-gold to-bronze text-ink font-bold rounded-xl
                       hover:from-gold/90 hover:to-bronze/90 transition-all shadow-lg disabled:opacity-50"
            >
              🚶 Travel for {travelCosts[selectedCityId || 0]} Gold ({getTravelTime(currentCity, selectedCityId || 0)}s)
            </button>
            {gold < travelCosts[selectedCityId || 0] && (
              <p className="text-red-400 text-sm">❌ Not enough gold to travel</p>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && lastTrade && (
        <ShareAchievement
          type="trade"
          data={{
            merchantName,
            commodity: lastTrade.commodity,
            quantity: lastTrade.quantity,
            profit: lastTrade.profit,
          }}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
