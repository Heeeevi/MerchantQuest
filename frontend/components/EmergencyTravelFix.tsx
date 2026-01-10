'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { GAME_WORLD_ABI, MERCHANT_NFT_ABI } from '@/lib/contracts';
import { CONTRACT_ADDRESSES } from '@/lib/config';

/**
 * Emergency tool to fix stuck travel state
 * Use this when you're stuck in "traveling" state and can't trade
 */
export default function EmergencyTravelFix() {
  const [showTool, setShowTool] = useState(false);
  const { address } = useAccount();

  // Get merchant ID
  const { data: merchantId } = useReadContract({
    address: CONTRACT_ADDRESSES.merchantNFT,
    abi: MERCHANT_NFT_ABI,
    functionName: 'playerMerchant',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Get travel status
  const { data: travelStatus, refetch: refetchStatus } = useReadContract({
    address: CONTRACT_ADDRESSES.gameWorld,
    abi: GAME_WORLD_ABI,
    functionName: 'getTravelStatus',
    args: merchantId ? [merchantId] : undefined,
    query: { enabled: !!merchantId },
  });

  // Complete travel transaction
  const { 
    writeContract, 
    data: hash, 
    isPending,
    error,
    reset
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleCompleteTravel = () => {
    writeContract({
      address: CONTRACT_ADDRESSES.gameWorld,
      abi: GAME_WORLD_ABI,
      functionName: 'completeTravel',
      args: [],
    });
  };

  // Parse travel status
  const isTraveling = travelStatus ? (travelStatus as [boolean, bigint, bigint, bigint])[0] : false;
  const toCity = travelStatus ? Number((travelStatus as [boolean, bigint, bigint, bigint])[2]) : 0;
  const timeRemaining = travelStatus ? Number((travelStatus as [boolean, bigint, bigint, bigint])[3]) : 0;

  // Reset and refetch after success
  if (isSuccess) {
    setTimeout(() => {
      reset();
      refetchStatus();
      window.location.reload(); // Refresh page to update all state
    }, 2000);
  }

  if (!showTool) {
    return (
      <button
        onClick={() => setShowTool(true)}
        className="fixed bottom-4 left-4 z-50 px-3 py-2 bg-red-900/80 text-white text-xs rounded-lg 
                   border border-red-500 hover:bg-red-800 transition-colors"
      >
        🔧 Fix Stuck Travel
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 p-4 bg-ink/95 border-2 border-gold rounded-xl max-w-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gold">🔧 Emergency Travel Fix</h3>
        <button 
          onClick={() => setShowTool(false)}
          className="text-parchment/60 hover:text-parchment"
        >
          ✕
        </button>
      </div>

      <div className="text-sm text-parchment/80 mb-4">
        <p className="mb-2">Use this if you&apos;re stuck and can&apos;t trade.</p>
        
        <div className="p-3 bg-ink/50 rounded-lg mb-3">
          <p className="text-xs text-parchment/60 mb-1">Travel Status:</p>
          <p className={`font-bold ${isTraveling ? 'text-yellow-400' : 'text-green-400'}`}>
            {isTraveling ? `🚶 Traveling (${timeRemaining}s left)` : '✅ Not Traveling'}
          </p>
          {isTraveling && (
            <p className="text-xs text-parchment/60 mt-1">
              Destination: City #{toCity}
            </p>
          )}
        </div>

        {error && (
          <div className="p-2 bg-red-900/50 border border-red-500 rounded mb-3">
            <p className="text-xs text-red-300">
              Error: {error.message.includes('Still traveling') 
                ? 'Still traveling! Wait for timer to finish.' 
                : error.message.slice(0, 100)}
            </p>
          </div>
        )}

        {isSuccess && (
          <div className="p-2 bg-green-900/50 border border-green-500 rounded mb-3">
            <p className="text-xs text-green-300">
              ✅ Travel completed! Refreshing page...
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => refetchStatus()}
          className="flex-1 px-3 py-2 bg-ink/50 text-parchment text-sm rounded-lg 
                     border border-gold/30 hover:border-gold/60 transition-colors"
        >
          🔄 Refresh
        </button>
        
        {isTraveling && (
          <button
            onClick={handleCompleteTravel}
            disabled={isPending || isConfirming || timeRemaining > 0}
            className="flex-1 px-3 py-2 bg-gold text-ink font-bold text-sm rounded-lg 
                       hover:bg-gold/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? '⏳ Confirm...' : 
             isConfirming ? '⛏️ Processing...' : 
             timeRemaining > 0 ? `Wait ${timeRemaining}s` :
             '🏁 Complete Travel'}
          </button>
        )}
      </div>

      <p className="text-xs text-parchment/40 mt-3">
        Merchant ID: {merchantId?.toString() || 'Loading...'}
      </p>
    </div>
  );
}
