'use client';

import { useAccount, useReadContract } from 'wagmi';
import { GAME_WORLD_ABI } from '@/lib/contracts';
import { CONTRACT_ADDRESSES, COMMODITIES } from '@/lib/config';
import { IMAGES } from '@/lib/images';
import Image from 'next/image';

interface InventoryProps {
  onSell: () => void;
}

export default function Inventory({ onSell }: InventoryProps) {
  const { address } = useAccount();

  // Get player inventory
  const { data: inventoryData, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.gameWorld,
    abi: GAME_WORLD_ABI,
    functionName: 'getInventory',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const quantities = inventoryData?.[0] || [];
  const avgPrices = inventoryData?.[1] || [];

  const totalValue = COMMODITIES.reduce((sum, commodity) => {
    const qty = Number(quantities[commodity.id] || 0);
    const price = Number(avgPrices[commodity.id] || 0);
    return sum + (qty * price);
  }, 0);

  const hasItems = COMMODITIES.some((c) => Number(quantities[c.id] || 0) > 0);

  if (isLoading) {
    return (
      <div className="card-medieval text-center py-12">
        <p className="text-2xl mb-2">⏳</p>
        <p>Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="card-medieval">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gold">🎒 Inventory</h2>
          <p className="text-sm text-ink/60">Your trading goods</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-ink/60">Total Value</p>
          <p className="text-2xl font-bold text-gold">💰 {totalValue.toLocaleString()}</p>
        </div>
      </div>

      {!hasItems ? (
        <div className="text-center py-12 bg-ink/10 rounded-xl">
          <p className="text-4xl mb-4">📦</p>
          <h3 className="text-xl font-bold mb-2">Your inventory is empty!</h3>
          <p className="text-ink/60 mb-4">
            Visit the Marketplace to buy some goods and start trading.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {COMMODITIES.map((commodity) => {
            const qty = Number(quantities[commodity.id] || 0);
            const avgPrice = Number(avgPrices[commodity.id] || 0);
            const totalCost = qty * avgPrice;

            if (qty === 0) return null;

            return (
              <div
                key={commodity.id}
                className="flex items-center gap-4 p-4 bg-ink/10 rounded-xl border border-gold/20"
              >
                {/* Commodity Image */}
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gold/20 to-bronze/20 
                              flex items-center justify-center border-2 border-gold/30 relative overflow-hidden">
                  <Image
                    src={IMAGES.getCommodityImage(commodity.id)}
                    alt={commodity.name}
                    fill
                    className="object-contain p-2"
                  />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{commodity.name}</h3>
                  <div className="flex gap-4 text-sm text-ink/60">
                    <span>Avg. Price: 💰 {avgPrice}</span>
                    <span>•</span>
                    <span>Total Cost: 💰 {totalCost}</span>
                  </div>
                </div>

                {/* Quantity */}
                <div className="text-right">
                  <p className="text-3xl font-bold text-gold">{qty}</p>
                  <p className="text-xs text-ink/60">units</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inventory Tips */}
      <div className="mt-6 p-4 bg-ink/10 rounded-lg border border-gold/20">
        <h4 className="font-bold text-gold mb-2">📊 Inventory Tips</h4>
        <ul className="text-sm space-y-1 text-ink/80">
          <li>• Average price shows what you paid per unit</li>
          <li>• Sell in cities where demand is high for maximum profit</li>
          <li>• Watch market prices - they change based on real data!</li>
          <li>• Diversify your goods to reduce risk</li>
        </ul>
      </div>

      {/* Quick Actions */}
      {hasItems && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              // Navigate to marketplace sell tab
              const marketTab = document.querySelector('[data-tab="market"]');
              if (marketTab) (marketTab as HTMLElement).click();
            }}
            className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
          >
            📤 Go to Marketplace to Sell
          </button>
        </div>
      )}
    </div>
  );
}
