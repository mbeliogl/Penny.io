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
 * Throws if the value is not a valid 32-byte Ed25519 public key
 */
export function normalizeSolanaAddress(address: string): string {
  try {
    return new PublicKey(address).toBase58();
  } catch {
    throw new Error('Invalid Solana address');
  }
}

/**
 * Attempt to normalize Solana address, returning null if the value is invalid.
 */
export function tryNormalizeSolanaAddress(address: string | null | undefined): string | null{
  if (!address) {
    return null; 
  }
  try {
    return normalizeSolanaAddress(address);
  } catch {
    return null;
  }
}

/**
 * Normalize an address that could be either EVM or Solana.
 * Tries EVM checksum first, then Solana base58.
 */
export function normalizeFlexibleAddress(address: string): string {
  const evm = tryNormalizeAddress(address);
  if (evm) {
    return evm;
  }
  return normalizeSolanaAddress(address);
}

/**
 * Attempt to normalize an address that could be EVM or Solana.
 * Returns null if both attempts fail.
 */
export function tryNormalizeFlexibleAddress(address: string | null | undefined): string | null {
  if (!address) {
    return null;
  }
  const evm = tryNormalizeAddress(address);
  if (evm) {
    return evm;
  }
  return tryNormalizeSolanaAddress(address);
}
