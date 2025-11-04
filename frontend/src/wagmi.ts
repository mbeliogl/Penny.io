import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum, base, baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Penny.io',
  projectId: 'YOUR_PROJECT_ID', // Get this from WalletConnect Cloud
  chains: [mainnet, polygon, optimism, arbitrum, base, baseSepolia],
  ssr: false, // If your dApp uses server side rendering (SSR)
});

// Note: CDP App ID configured in .env (VITE_COINBASE_CDP_APP_ID)
// RainbowKit automatically integrates with Coinbase Wallet
// For advanced CDP features, see: https://www.rainbowkit.com/docs/custom-wallets