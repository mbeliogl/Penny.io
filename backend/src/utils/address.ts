import { getAddress } from 'ethers';
import { PublicKey } from '@solana/web3.js'

/**
 * Normalize an Ethereum address to its canonical EIP-55 checksum form.
 * Throws if the value is not a valid 20-byte hex address.
 */
export function normalizeAddress(address: string): string {
  return getAddress(address);
}

/**
 * Attempt to normalize an address, returning null if the value is invalid.
 */
export function tryNormalizeAddress(address: string | null | undefined): string | null {
  if (!address) {
    return null;
  }

  try {
    return normalizeAddress(address);
  } catch {
    return null;
  }
}

/**
 * Normalize a Solana address to its canonical Base58 form
 * Thros if the value is not a valid 32-byte Ed25519 public key
 */
export function normalizeSolanaAddress(address: string): string {
  try {
    return new PublicKey(address).toBase58();
  } catch {
    throw new Error('Invalid Solana address');
  }
}
