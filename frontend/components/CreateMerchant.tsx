'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { MERCHANT_NFT_ABI } from '@/lib/contracts';
import { CONTRACT_ADDRESSES } from '@/lib/config';
import { IMAGES } from '@/lib/images';
import Image from 'next/image';

interface CreateMerchantProps {
  onSuccess: () => void;
}

export default function CreateMerchant({ onSuccess }: CreateMerchantProps) {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle success
  if (isSuccess) {
    setTimeout(() => {
      onSuccess();
    }, 1000);
  }

  const handleCreate = async () => {
    if (!name.trim() || name.length > 32) return;
    
    setIsCreating(true);
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.merchantNFT,
        abi: MERCHANT_NFT_ABI,
        functionName: 'createMerchant',
        args: [name.trim()],
      });
    } catch (error) {
      console.error('Error creating merchant:', error);
      setIsCreating(false);
    }
  };

  return (
    <div className="card-medieval max-w-md w-full">
      <div className="text-center mb-6">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-gold shadow-gold-glow relative">
          <Image
            src={IMAGES.characters.fullBody}
            alt="Merchant"
            fill
            className="object-cover"
          />
        </div>
        <h2 className="text-2xl font-bold text-gold mb-2">Create Your Merchant</h2>
        <p className="text-sm">
          Begin your journey as a merchant. Choose a name that will echo through the ages!
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2">Merchant Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your merchant's name..."
            maxLength={32}
            className="w-full px-4 py-3 rounded-lg bg-ink/20 border-2 border-gold/30 
                     text-ink placeholder-ink/50 focus:border-gold focus:outline-none"
            disabled={isPending || isConfirming}
          />
          <p className="text-xs mt-1 text-ink/60">{name.length}/32 characters</p>
        </div>

        <div className="bg-ink/10 rounded-lg p-4 text-sm">
          <h4 className="font-bold mb-2">🎁 Starting Package:</h4>
          <ul className="space-y-1">
            <li>• 💰 1,000 Gold Coins</li>
            <li>• 📍 Starting City: Silverport</li>
            <li>• 🎒 Empty Inventory (ready to trade!)</li>
          </ul>
        </div>

        <button
          onClick={handleCreate}
          disabled={!name.trim() || isPending || isConfirming || isSuccess}
          className="btn-medieval w-full"
        >
          {isPending ? '⏳ Confirm in Wallet...' : 
           isConfirming ? '⛏️ Creating Merchant...' : 
           isSuccess ? '✅ Merchant Created!' :
           '⚔️ Begin Your Journey'}
        </button>

        {isSuccess && (
          <div className="text-center text-green-600 font-bold">
            🎉 Welcome, {name}! Your adventure begins...
          </div>
        )}
      </div>
    </div>
  );
}
