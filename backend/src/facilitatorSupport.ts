import { generateJwt } from '@coinbase/cdp-sdk/auth';

type SupportedKind = {
  scheme: string;
  network: string;
  extra?: { feePayer?: string; [key: string]: unknown };
};

type SupportedResponse = { kinds: SupportedKind[] };

const requestHost = 'api.cdp.coinbase.com';
const supportedPath = '/platform/v2/x402/supported';

let feePayerCache: Record<string, string> | null = null;
let hydratePromise: Promise<void> | null = null;

async function hydrateCache(): Promise<void> {
  const token = await generateJwt({
    apiKeyId: process.env.CDP_API_KEY_ID!,
    apiKeySecret: process.env.CDP_API_KEY_SECRET!,
    requestMethod: 'GET',
    requestHost,
    requestPath: supportedPath,
    expiresIn: 120,
  });

  const response = await fetch(`https://${requestHost}${supportedPath}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to load facilitator support: ${response.status}`);
  }

  const payload = (await response.json()) as SupportedResponse;

  feePayerCache = payload.kinds.reduce<Record<string, string>>((acc, kind) => {
    if (kind.extra?.feePayer) {
      acc[kind.network] = kind.extra.feePayer;
    }
    return acc;
  }, {});
}

export async function ensureFacilitatorSupportLoaded(): Promise<void> {
  if (feePayerCache) return;
  if (!hydratePromise) {
    hydratePromise = hydrateCache().catch(err => {
      hydratePromise = null;
      throw err;
    });
  }
  await hydratePromise;
}

export async function getFacilitatorFeePayer(network: string): Promise<string | undefined> {
  await ensureFacilitatorSupportLoaded();
  return feePayerCache?.[network];
}