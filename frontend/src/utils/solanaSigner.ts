import type { Transaction as KitTransaction } from '@solana/transactions';
import type { TransactionSigner } from '@solana/kit';
import type { SignatureDictionary } from '@solana/signers';
import type { Address } from '@solana/addresses';
import { VersionedTransaction, Transaction as LegacyTransaction } from '@solana/web3.js';

type SolanaWalletProvider = {
  publicKey?: { toBase58(): string } | { toString(): string } | string | null;
  address?: string;
  accounts?: Array<{ address?: string; publicKey?: { toBase58(): string } | string | null }>;
  signTransaction?: (
    transaction: VersionedTransaction | LegacyTransaction
  ) => Promise<VersionedTransaction | LegacyTransaction>;
  signAllTransactions?: (
    transactions: (VersionedTransaction | LegacyTransaction)[]
  ) => Promise<(VersionedTransaction | LegacyTransaction)[]>;
};

type Web3Transaction = VersionedTransaction | LegacyTransaction;

export function createSolanaTransactionSigner(
  provider?: SolanaWalletProvider | null
): TransactionSigner | undefined {
  if (!provider) {
    return undefined;
  }

  if (typeof (provider as TransactionSigner).signTransactions === 'function') {
    return provider as TransactionSigner;
  }

  if (typeof provider.signTransaction !== 'function') {
    return undefined;
  }

  const address = extractAddress(provider);
  if (!address) {
    return undefined;
  }

  return {
    address: address as Address<string>,
    async signTransactions(transactions) {
      if (!transactions.length) {
        return [];
      }

      const deserialized = transactions.map(deserializeTransaction);

      const signedTransactions = provider.signAllTransactions
        ? await provider.signAllTransactions([...deserialized])
        : await Promise.all(deserialized.map((tx) => provider.signTransaction!(tx)));

      return signedTransactions.map((signedTx, index) =>
        buildSignatureDictionary(transactions[index], signedTx)
      );
    },
  };
}

function extractAddress(provider: SolanaWalletProvider): string | undefined {
  const possibleKeys = [
    provider.publicKey,
    provider.address,
    provider.accounts?.[0]?.address,
    provider.accounts?.[0]?.publicKey,
  ];

  for (const key of possibleKeys) {
    if (!key) continue;
    if (typeof key === 'string') {
      return key;
    }
    if (typeof key === 'object' && 'toBase58' in key && typeof key.toBase58 === 'function') {
      return key.toBase58();
    }
    if (typeof key === 'object' && 'toString' in key && typeof key.toString === 'function') {
      return key.toString();
    }
  }

  return undefined;
}

function deserializeTransaction(transaction: KitTransaction): Web3Transaction {
  const messageBytes = transaction.messageBytes as Uint8Array;
  try {
    return VersionedTransaction.deserialize(messageBytes);
  } catch {
    return LegacyTransaction.from(messageBytes);
  }
}

function buildSignatureDictionary(
  transaction: KitTransaction,
  signedTransaction: Web3Transaction
): SignatureDictionary {
  const signerAddresses = Object.keys(transaction.signatures) as Address<string>[];

  const entries = signerAddresses.map((address, index) => {
    const signatureBytes = extractSignatureBytes(signedTransaction, index);
    if (!signatureBytes) {
      throw new Error(`Missing signature for signer ${address}`);
    }
    return [address, signatureBytes] as const;
  });

  return Object.freeze(Object.fromEntries(entries));
}

function extractSignatureBytes(transaction: Web3Transaction, index: number): Uint8Array | null {
  if (transaction instanceof VersionedTransaction) {
    const signature = transaction.signatures[index];
    return signature ? new Uint8Array(signature) : null;
  }

  const entry = transaction.signatures[index];
  if (!entry || !entry.signature) {
    return null;
  }

  return new Uint8Array(entry.signature);
}
