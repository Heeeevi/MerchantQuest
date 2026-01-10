import type { Metadata } from 'next';
import { Providers } from './providers';
import { AudioProvider } from '@/contexts/AudioContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'MerchantQuest | Medieval Trading RPG',
  description: 'Trade commodities, travel between cities, and become the greatest merchant in the realm!',
  keywords: ['web3', 'game', 'trading', 'nft', 'mantle', 'blockchain'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AudioProvider>
            {children}
          </AudioProvider>
        </Providers>
      </body>
    </html>
  );
}
