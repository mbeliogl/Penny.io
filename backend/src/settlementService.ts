/* What it does:

1. Takes verified authorization payload
2. Submits it on-chain using platform wallet
3. Returns transaction hash
4. Handles errors (insufficient gas, network issues, etc.)

*/

import { PaymentPayload, PaymentRequirements } from 'x402/types';
import { useFacilitator } from 'x402/verify';
import { facilitator as defaultFacilitator, createFacilitatorConfig } from '@coinbase/x402';

// Use CDP facilitator (same config as verification)
const facilitatorConfig = process.env.COINBASE_CDP_API_KEY && process.env.COINBASE_CDP_API_SECRET
  ? createFacilitatorConfig(process.env.COINBASE_CDP_API_KEY, process.env.COINBASE_CDP_API_SECRET)
  : defaultFacilitator;

const facilitatorClient = useFacilitator(facilitatorConfig);

/**
 * Settle authorization on-chain via CDP Facilitator
 * CDP handles the on-chain transaction and pays gas 
 */
export async function settleAuthorization(
  paymentPayload: PaymentPayload,
  paymentRequirements: PaymentRequirements
): Promise<{ txHash: string } | { error: string }> {
  try {
    console.log('🔧 Settling payment via CDP facilitator...');
    console.log(`   From: ${paymentPayload.payload.authorization.from}`);
    console.log(`   To: ${paymentPayload.payload.authorization.to}`);
    console.log(`   Amount: ${paymentPayload.payload.authorization.value} micro USDC`);

    // Call CDP's settle API - it handles everything
    const settlementResult = await facilitatorClient.settle(
      paymentPayload,
      paymentRequirements
    );

    console.log('✅ Settlement result:', settlementResult);

    // Check if CDP returned success
    if (settlementResult.success === true) {
        // Extract transaction hash CDP's response
        const txHash = settlementResult.transaction;

        if (txHash) {
            console.log('✅ Settlement success. txHash:', txHash);
        } else {
            console.warn('⚠️ CDP settlement succeeded but missing transaction hash');
            console.warn('Settlement result:', JSON.stringify(settlementResult, null, 2));
        }

        return {txHash: txHash || undefined};
    }

    console.error('❌ Settlement failed:', settlementResult);
    return { error: settlementResult.error || 'Settlement failed' };
    

    // If no transaction hash, settlement might have failed
    return { 
      error: settlementResult.error || 'Settlement completed but no transaction hash returned' 
    };

  } catch (error) {
    console.error('❌ Settlement failed:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown settlement error' 
    };
  }
}