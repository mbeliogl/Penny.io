import { useEffect, useState } from 'react';
import { useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react';

// USDC contract addresses
const USDC_ADDRESSES = {
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base mainnet
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
} as const;

const AppKitConnectButton = () => {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider('eip155');
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!isConnected || !address || !chainId || !walletProvider) {
        setUsdcBalance(null);
        return;
      }

      const usdcAddress = USDC_ADDRESSES[chainId as keyof typeof USDC_ADDRESSES];
      if (!usdcAddress) {
        setUsdcBalance(null);
        return;
      }

      try {
        // ERC20 balanceOf call
        const data = await (walletProvider as any).request({
          method: 'eth_call',
          params: [
            {
              to: usdcAddress,
              data: `0x70a08231000000000000000000000000${address.slice(2)}`, // balanceOf(address)
            },
            'latest',
          ],
        });

        // Convert hex to decimal and format (USDC has 6 decimals)
        const balance = BigInt(data as string);
        const formatted = (Number(balance) / 1_000_000).toFixed(2);
        setUsdcBalance(formatted);
      } catch (error) {
        console.error('Failed to fetch USDC balance:', error);
        setUsdcBalance(null);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [isConnected, address, chainId, walletProvider]);

  const showUsdcBalance = isConnected && usdcBalance !== null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <appkit-button balance="hide" />
      {showUsdcBalance && (
        <div
          style={{
            backgroundColor: 'rgba(243, 243, 243, 0.65)',
            color: '#202020',
            padding: '8px 14px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            boxShadow: 'none',
            transition: 'all 0.2s ease',
            border: '1px solid rgba(233, 233, 233, 0.4)',
          }}
        >
          {usdcBalance} USDC
        </div>
      )}
    </div>
  );
};

export default AppKitConnectButton;
