import { randomUUID } from 'crypto';
import { supabase } from '../src/supabaseClient';
import { normalizeFlexibleAddress, tryNormalizeFlexibleAddress } from '../src/utils/address';

type SupportedNetwork = 'base' | 'base-sepolia' | 'solana' | 'solana-devnet';

interface AuthorRow {
  author_uuid: string | null;
  address: string;
  primary_payout_network: SupportedNetwork | null;
  secondary_payout_network: SupportedNetwork | null;
  secondary_payout_address: string | null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuid = (value: string | null | undefined): value is string =>
  Boolean(value && UUID_REGEX.test(value));

async function ensureAuthorUuid(author: AuthorRow): Promise<string> {
  if (author.author_uuid && isUuid(author.author_uuid)) {
    return author.author_uuid;
  }

  const newUuid = randomUUID();
  const { error } = await supabase
    .from('authors')
    .update({ author_uuid: newUuid })
    .eq('address', author.address);

  if (error) {
    throw new Error(`Failed to assign UUID for author ${author.address}: ${error.message}`);
  }

  return newUuid;
}

async function upsertWallet(options: {
  authorUuid: string;
  address: string;
  network: SupportedNetwork;
  isPrimary: boolean;
}) {
  const normalizedAddress = normalizeFlexibleAddress(options.address);

  const { error } = await supabase
    .from('author_wallets')
    .upsert(
      {
        author_uuid: options.authorUuid,
        address: normalizedAddress,
        network: options.network,
        is_primary: options.isPrimary,
      },
      { onConflict: 'address' }
    );

  if (error) {
    throw new Error(`Failed to upsert wallet ${normalizedAddress}: ${error.message}`);
  }
}

async function main() {
  console.log('🔄 Backfilling author wallet records...');

  const { data: authors, error } = await supabase
    .from('authors')
    .select('author_uuid, address, primary_payout_network, secondary_payout_network, secondary_payout_address');

  if (error || !authors) {
    throw new Error(`Unable to load authors: ${error?.message}`);
  }

  let updated = 0;

  for (const author of authors as AuthorRow[]) {
    const authorUuid = await ensureAuthorUuid(author);
    const primaryNetwork: SupportedNetwork = author.primary_payout_network ?? 'base';

    await upsertWallet({
      authorUuid,
      address: author.address,
      network: primaryNetwork,
      isPrimary: true,
    });

    const secondaryAddress = tryNormalizeFlexibleAddress(author.secondary_payout_address);
    if (secondaryAddress && author.secondary_payout_network) {
      await upsertWallet({
        authorUuid,
        address: secondaryAddress,
        network: author.secondary_payout_network,
        isPrimary: false,
      });
    }

    updated++;
  }

  console.log(`✅ Wallets backfilled for ${updated} authors`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
