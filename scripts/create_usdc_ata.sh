#!/usr/bin/env bash
set -euo pipefail

# Default configuration (override via env vars if needed)
USDC_MINT="${USDC_MINT:-EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v}"
FEE_PAYER_KEYPAIR="${FEE_PAYER_KEYPAIR:-$HOME/.config/solana/mainnet-fee-payer.json}"
RPC_URL="${RPC_URL:-https://api.mainnet-beta.solana.com}"

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <owner-wallet-address>"
  exit 1
fi

OWNER_ADDRESS="$1"

for cmd in solana spl-token solana-keygen; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd"
    exit 1
  fi
done

if [[ ! -f "$FEE_PAYER_KEYPAIR" ]]; then
  echo "Fee payer keypair not found at $FEE_PAYER_KEYPAIR"
  exit 1
fi

echo "Configuring Solana CLI for $RPC_URL..."
solana config set --url "$RPC_URL" --keypair "$FEE_PAYER_KEYPAIR" >/dev/null

FEE_PAYER_PUBKEY="$(solana-keygen pubkey "$FEE_PAYER_KEYPAIR")"
FEE_PAYER_BALANCE="$(solana balance "$FEE_PAYER_KEYPAIR")"
echo "Fee payer: $FEE_PAYER_PUBKEY (balance: $FEE_PAYER_BALANCE)"
echo "Owner: $OWNER_ADDRESS"
echo "USDC mint: $USDC_MINT"

ATA_ADDRESS="$(spl-token address --token "$USDC_MINT" --owner "$OWNER_ADDRESS")"
echo "Target ATA: $ATA_ADDRESS"

echo "Creating ATA if needed..."
spl-token create-account "$USDC_MINT" \
  --owner "$OWNER_ADDRESS" \
  --fee-payer "$FEE_PAYER_KEYPAIR"

echo "Current token accounts for $OWNER_ADDRESS:"
spl-token accounts --owner "$OWNER_ADDRESS"
