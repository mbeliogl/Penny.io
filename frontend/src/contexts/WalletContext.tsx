import { createContext, useContext, ReactNode } from 'react';
import { useAccount, useBalance, useDisconnect } from 'wagmi';

interface WalletContextType {
  address: string | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string | undefined;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { address, isConnected, isConnecting } = useAccount();
  const { data: balance } = useBalance({ address });
  const { disconnect } = useDisconnect();

  const formattedBalance = balance 
    ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}`
    : undefined;

  const value: WalletContextType = {
    address,
    isConnected,
    isConnecting,
    balance: formattedBalance,
    disconnect,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}