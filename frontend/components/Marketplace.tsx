'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { GAME_WORLD_ABI, MERCHANT_NFT_ABI } from '@/lib/contracts';
import { CONTRACT_ADDRESSES, COMMODITIES } from '@/lib/config';
import { IMAGES } from '@/lib/images';
import Image from 'next/image';
import ShareAchievement from './ShareAchievement';

interface MarketplaceProps {
  currentCity: number;
  gold: number;
  onTrade: () => void;
}

interface LastTrade {
  type: 'buy' | 'sell';
  commodity: number;
  quantity: number;
  totalCost: number;
  profit?: number;
}

export default function Marketplace({ currentCity, gold, onTrade }: MarketplaceProps) {
  const [selectedCommodity, setSelectedCommodity] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [showShareModal, setShowShareModal] = useState(false);
  const [lastTrade, setLastTrade] = useState<LastTrade | null>(null);

  const { address } = useAccount();

  // Get merchant name for sharing
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

  // Get city prices
  const { data: pricesData, refetch: refetchPrices } = useReadContract({
    address: CONTRACT_ADDRESSES.gameWorld,
    abi: GAME_WORLD_ABI,
    functionName: 'getAllCityPrices',
    args: [BigInt(currentCity)],
  });

  // Get player inventory
  const { data: inventoryData } = useReadContract({
    address: CONTRACT_ADDRESSES.gameWorld,
    abi: GAME_WORLD_ABI,
    functionName: 'getInventory',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle success - show share modal for sells
  useEffect(() => {
    if (isSuccess && selectedCommodity !== null) {
      const sellPrice = Number(sellPrices[selectedCommodity] || 0);
      const buyPrice = Number(buyPrices[selectedCommodity] || 0);
      
      // Calculate approximate profit for sell trades
      const profit = tradeType === 'sell' 
        ? Math.floor((sellPrice - buyPrice * 0.9) * quantity) // Rough estimate
        : undefined;

      setLastTrade({
        type: tradeType,
        commodity: selectedCommodity,
        quantity,
        totalCost: getTotalCost(),
        profit,
      });

      setTimeout(() => {
        onTrade();
        refetchPrices();
        
        // Show share modal only for profitable sells
        if (tradeType === 'sell' && profit && profit > 0) {
          setShowShareModal(true);
        }
        
        setSelectedCommodity(null);
        setQuantity(1);
      }, 1000);
    }
  }, [isSuccess]);

  const buyPrices = pricesData?.[0] || [];
  const sellPrices = pricesData?.[1] || [];
  const inventory = inventoryData?.[0] || [];

  const handleTrade = () => {
    if (selectedCommodity === null) return;

    if (tradeType === 'buy') {
      writeContract({
        address: CONTRACT_ADDRESSES.gameWorld,
        abi: GAME_WORLD_ABI,
        functionName: 'buy',
        args: [BigInt(selectedCommodity), BigInt(quantity)],
      });
    } else {
      writeContract({
        address: CONTRACT_ADDRESSES.gameWorld,
        abi: GAME_WORLD_ABI,
        functionName: 'sell',
        args: [BigInt(selectedCommodity), BigInt(quantity)],
      });
    }
  };

  const getMaxQuantity = (commodityId: number) => {
    if (tradeType === 'buy') {
      const price = Number(buyPrices[commodityId] || 0);
      if (price === 0) return 0;
      return Math.floor(gold / price);
    } else {
      return Number(inventory[commodityId] || 0);
    }
  };

  const getTotalCost = () => {
    if (selectedCommodity === null) return 0;
    const price = tradeType === 'buy' 
      ? Number(buyPrices[selectedCommodity] || 0)
      : Number(sellPrices[selectedCommodity] || 0);
    return price * quantity;
  };

  return (
    <div className="card-medieval">
      <h2 className="text-2xl font-bold text-gold mb-4">🏪 Marketplace</h2>
      <p className="text-sm mb-6">
        Buy low, sell high! Each city has different supply and demand.
      </p>

      {/* Trade Type Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setTradeType('buy'); setSelectedCommodity(null); setQuantity(1); }}
          className={`flex-1 py-3 rounded-lg font-bold transition-all ${
            tradeType === 'buy'
              ? 'bg-green-600 text-white'
              : 'bg-ink/30 text-ink hover:bg-ink/40'
          }`}
        >
          💰 Buy Goods
        </button>
        <button
          onClick={() => { setTradeType('sell'); setSelectedCommodity(null); setQuantity(1); }}
          className={`flex-1 py-3 rounded-lg font-bold transition-all ${
            tradeType === 'sell'
              ? 'bg-blue-600 text-white'
              : 'bg-ink/30 text-ink hover:bg-ink/40'
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
          const maxQty = getMaxQuantity(commodity.id);
          const canTrade = tradeType === 'buy' ? gold >= buyPrice : owned > 0;

          return (
            <div
              key={commodity.id}
              onClick={() => canTrade && setSelectedCommodity(commodity.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${isSelected 
                          ? 'border-gold bg-gold/20 shadow-gold-glow' 
                          : canTrade
                            ? 'border-gold/30 bg-ink/20 hover:border-gold/60'
                            : 'border-red-500/30 bg-ink/10 opacity-50 cursor-not-allowed'
                        }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image
                    src={IMAGES.getCommodityImage(commodity.id)}
                    alt={commodity.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-bold">{commodity.name}</h3>
                  <p className="text-xs text-ink/60">Owned: {owned}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className={`p-2 rounded ${tradeType === 'buy' ? 'bg-green-600/20' : 'bg-ink/10'}`}>
                  <p className="text-xs text-ink/60">Buy Price</p>
                  <p className="font-bold text-green-600">💰 {buyPrice}</p>
                </div>
                <div className={`p-2 rounded ${tradeType === 'sell' ? 'bg-blue-600/20' : 'bg-ink/10'}`}>
                  <p className="text-xs text-ink/60">Sell Price</p>
                  <p className="font-bold text-blue-600">💰 {sellPrice}</p>
                </div>
              </div>

              {isSelected && (
                <div className="mt-3 pt-3 border-t border-gold/30">
                  <p className="text-xs text-ink/60 mb-1">
                    Max: {maxQty} units
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Trade Panel */}
      {selectedCommodity !== null && (
        <div className="bg-ink/20 rounded-xl p-4 border border-gold/30">
          <h3 className="font-bold mb-4">
            {tradeType === 'buy' ? '💰 Buy' : '📤 Sell'} {COMMODITIES[selectedCommodity]?.name}
          </h3>

          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm text-ink/60 mb-1 block">Quantity</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg bg-ink/30 hover:bg-ink/50 transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(getMaxQuantity(selectedCommodity), parseInt(e.target.value) || 1)))}
                  className="w-20 h-10 text-center rounded-lg bg-ink/20 border border-gold/30"
                  min={1}
                  max={getMaxQuantity(selectedCommodity)}
                />
                <button
                  onClick={() => setQuantity(Math.min(getMaxQuantity(selectedCommodity), quantity + 1))}
                  className="w-10 h-10 rounded-lg bg-ink/30 hover:bg-ink/50 transition-colors"
                >
                  +
                </button>
                <button
                  onClick={() => setQuantity(getMaxQuantity(selectedCommodity))}
                  className="px-3 h-10 rounded-lg bg-gold/20 text-gold text-sm hover:bg-gold/30 transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-ink/60">Total {tradeType === 'buy' ? 'Cost' : 'Revenue'}</p>
              <p className="text-2xl font-bold text-gold">💰 {getTotalCost()}</p>
            </div>
          </div>

          <button
            onClick={handleTrade}
            disabled={isPending || isConfirming || quantity < 1}
            className={`w-full py-3 rounded-lg font-bold transition-all ${
              tradeType === 'buy'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isPending ? '⏳ Confirm in Wallet...' :
             isConfirming ? '⛏️ Processing...' :
             isSuccess ? '✅ Trade Complete!' :
             tradeType === 'buy' 
               ? `💰 Buy ${quantity} ${COMMODITIES[selectedCommodity]?.name}`
               : `📤 Sell ${quantity} ${COMMODITIES[selectedCommodity]?.name}`
            }
          </button>
        </div>
      )}

      {/* Market Tips */}
      <div className="mt-6 p-4 bg-ink/10 rounded-lg border border-gold/20">
        <h4 className="font-bold text-gold mb-2">💡 Trading Tips</h4>
        <ul className="text-sm space-y-1 text-ink/80">
          <li>• <strong>Goldmere</strong>: Buy Gold cheap, sell Wheat high</li>
          <li>• <strong>Silkwind</strong>: Buy Silk & Spices cheap, sell Iron high</li>
          <li>• <strong>Ironhold</strong>: Buy Iron & Wheat cheap, sell luxuries high</li>
          <li>• Prices change based on real-world market data!</li>
        </ul>
      </div>

      {/* Share Achievement Modal */}
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
