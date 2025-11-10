import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { SolanaAdapter } from '@reown/appkit-adapter-solana';
import { base, baseSepolia, solana, solanaDevnet } from '@reown/appkit/networks';

import type { AppKitNetwork } from '@reown/appkit/networks';

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [base, baseSepolia, solana, solanaDevnet];

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

const metadata = {
  name: 'Penny.io',
  description: 'Content Monetization Reimagined',
  url: window.location.origin,
  icons: ['https://penny.io/icon.png'],
};

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [base, baseSepolia],
  ssr: false,
});

const solanaAdapter = new SolanaAdapter();



createAppKit({
  projectId,
  adapters: [wagmiAdapter, solanaAdapter],
  networks,
  metadata,
  themeMode: 'light',
  chainImages: {
    [base.id]: '/icons/base.png',
    [baseSepolia.id]: '/icons/base-sepolia.png',
    [solana.id]: '/icons/solana.png',
    [solanaDevnet.id]: '/icons/solana-devnet.png',
  },
  features: {
    swaps: false,
    onramp: false,
    email: false,
    socials: [],
  },
});

export { wagmiAdapter };
