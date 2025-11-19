import { useEffect, useState, useRef } from 'react';
import { useAppKitAccount, useAppKitState, useDisconnect } from '@reown/appkit/react';
import { modal } from '../appkit';

/**
 * Wallet Connection Manager Hook
 *
 * Prevents Phantom and other wallets from showing auto-connect prompts
 * when users have explicitly disconnected.
 *
 * How it works:
 * 1. When user disconnects, we set a flag in localStorage
 * 2. On page load, we check this flag and disconnect if set
 * 3. When user connects, we clear the flag
 *
 * This respects the user's disconnect intent and prevents annoying
 * automatic reconnection prompts from wallets like Phantom.
 */

const DISCONNECT_FLAG_KEY = 'penny_wallet_disconnected';

export function useWalletConnectionManager() {
  const { isConnected, address } = useAppKitAccount();
  const { open } = useAppKitState();
  const { disconnect } = useDisconnect();

  // On mount: Check if user previously disconnected
  useEffect(() => {
    const wasDisconnected = localStorage.getItem(DISCONNECT_FLAG_KEY) === 'true';

    if (wasDisconnected && isConnected) {
      // User explicitly disconnected before, but wallet is trying to auto-reconnect
      // Disconnect it to respect the user's choice
      console.log('Preventing auto-reconnect - user previously disconnected');

      // Clear the flag immediately to prevent blocking manual reconnection attempts
      localStorage.removeItem(DISCONNECT_FLAG_KEY);

      disconnect();
    }
  }, []); // Only run once on mount

  // When modal opens, clear disconnect flag to allow reconnection
  useEffect(() => {
    if (open) {
      // User opened the modal - clear disconnect flag
      // This allows them to reconnect even if they previously disconnected
      localStorage.removeItem(DISCONNECT_FLAG_KEY);
      console.log('AppKit modal opened - cleared disconnect flag');
    }
  }, [open]);

  // Track previous address to detect account switches
  const [prevAddress, setPrevAddress] = useState<string | undefined>(undefined);
  const hasSubscribedRef = useRef(false);

  // Subscribe to AppKit account changes using the modal instance
  useEffect(() => {
    if (hasSubscribedRef.current) return;
    hasSubscribedRef.current = true;

    const unsubscribe = modal.subscribeAccount((state: any) => {
      // If address changed while connected, reload to sync state
      if (state.isConnected && state.address && prevAddress && prevAddress !== state.address) {
        console.log('Account switched detected:', prevAddress, '->', state.address);
        console.log('Reloading to sync with new wallet...');
        window.location.reload();
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [prevAddress]);

  // When connection state changes
  useEffect(() => {
    if (isConnected && address) {
      // User is connected - ensure disconnect flag is cleared
      localStorage.removeItem(DISCONNECT_FLAG_KEY);
      console.log('Wallet connected:', address);
      setPrevAddress(address);
    } else if (!isConnected && address === undefined) {
      // User disconnected - set flag to prevent auto-reconnect
      localStorage.setItem(DISCONNECT_FLAG_KEY, 'true');

      // Clear Phantom's cached state
      if (typeof window !== 'undefined' && window.solana?.disconnect) {
        window.solana.disconnect().catch((err: any) => {
          console.log('Phantom disconnect cleanup (expected):', err);
        });
      }

      console.log('Wallet disconnected - set prevent reconnect flag');
      setPrevAddress(undefined);
    }
  }, [isConnected, address]);

  // Listen for MetaMask account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts: string[]) => {
        console.log('MetaMask accounts changed:', accounts);
        if (accounts.length > 0) {
          // Account switched - force a page reload to sync AppKit state
          console.log('Account switched, reloading page to sync state...');
          window.location.reload();
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  /**
   * Enhanced disconnect function that sets the flag to prevent auto-reconnect
   */
  const disconnectAndPreventReconnect = async () => {
    // Set flag BEFORE disconnecting to prevent race conditions
    localStorage.setItem(DISCONNECT_FLAG_KEY, 'true');

    // Clear Phantom's cached connection state
    if (typeof window !== 'undefined' && window.solana?.disconnect) {
      try {
        await window.solana.disconnect();
        console.log('Phantom disconnected from cache');
      } catch (error) {
        console.log('Phantom disconnect error (expected if not connected):', error);
      }
    }

    // Disconnect the wallet through AppKit
    await disconnect();

    console.log('Wallet disconnected - auto-reconnect prevented');
  };

  return {
    disconnectAndPreventReconnect,
  };
}
