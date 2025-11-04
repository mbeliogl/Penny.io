// x402 Payment Service for handling micropayments
import { apiService } from './api';

export interface PaymentPayload {
  from: string;
  to: string;
  value: number;  // Integer in micro USDC
  signature: string;
  message?: string;
}

export interface PaymentRequirement {
  price: string;
  network: string;
  facilitator: string;
  to: string;
  accept: PaymentAccept | null;
  raw: any;
}

export interface PaymentAccept {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds?: number;
  asset?: string;
  outputSchema?: Record<string, unknown>;
  extra?: Record<string, unknown>;
}

export interface PaymentResponse {
  success: boolean;
  paymentRequired?: PaymentRequirement;
  receipt?: string;
  error?: string;
}

class X402PaymentService {
  private facilitatorUrl = import.meta.env.VITE_X402_FACILITATOR_URL || 'https://x402.org/facilitator';
  private network = import.meta.env.VITE_X402_NETWORK || 'base-sepolia';

  /**
   * Get facilitator URL - uses CDP if configured, otherwise falls back to public
   */
  getFacilitatorUrl(): string {
    const cdpAppId = import.meta.env.VITE_COINBASE_CDP_APP_ID;
    if (cdpAppId) {
      return 'https://facilitator.cdp.coinbase.com';
    }
    return this.facilitatorUrl;
  }

  /**
   * Check if CDP is enabled
   */
  isCDPEnabled(): boolean {
    return !!import.meta.env.VITE_COINBASE_CDP_APP_ID;
  }

  /**
   * Attempt to access a paid resource
   * If payment is required, returns payment requirements
   * If payment was successful, returns success
   */
  async attemptPayment(
    endpoint: string,
    paymentPayload?: PaymentPayload
  ): Promise<PaymentResponse> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add x402 payment header if we have a payment payload
      if (paymentPayload) {
        headers['X-PAYMENT'] = btoa(JSON.stringify(paymentPayload));
      }

      const response = await fetch(`http://localhost:3001/api${endpoint}`, {
        method: 'POST',
        headers,
      });

      if (response.status === 402) {
        // Payment required - extract payment requirements from backend 402 response
        const paymentData = await response.json();
        console.log('🔍 Received 402 payment response:', paymentData);
        const paymentSpec: PaymentAccept | undefined = paymentData.accepts?.[0]; // Get first payment option
        const priceInUsd = paymentData.price
          || (paymentSpec?.maxAmountRequired
            ? `$${(parseInt(paymentSpec.maxAmountRequired, 10) / 1_000_000).toFixed(2)}`
            : 'Unknown');

        return {
          success: false,
          paymentRequired: {
            price: priceInUsd,
            network: paymentSpec?.network || this.network,
            facilitator: this.getFacilitatorUrl(), // Use dynamic CDP-aware facilitator
            to: paymentSpec?.payTo || '', // Recipient from backend (article author)
            accept: paymentSpec || null,
            raw: paymentData
          },
        };
      }

      if (response.ok) {
        return {
          success: true,
          receipt: 'Payment processed successfully',
        };
      }

      throw new Error(`Payment failed: ${response.status}`);
    } catch (error) {
      console.error('x402 payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  }

  /**
   * Create a payment payload for a given article purchase
   */
  async createPaymentPayload(
    articlePrice: number,
    recipientAddress: string,
    userAddress: string,
    signMessage: (message: string) => Promise<string>
  ): Promise<PaymentPayload> {
    try {
      // Convert price to micro USDC (USDC has 6 decimals)
      const valueInCents = Math.round(articlePrice * 100);
      const valueInMicroUSDC = valueInCents * 10000; // Convert to micro USDC (integer)

      // Create message to sign
      const messageToSign = `Authorize payment of ${valueInMicroUSDC} micro USDC from ${userAddress} to ${recipientAddress}`;

      // Get signature from user's wallet
      const signature = await signMessage(messageToSign);

      // Return flat payment payload structure (matches backend validation schema)
      return {
        from: userAddress,
        to: recipientAddress, // Dynamic recipient - article author from backend
        value: valueInMicroUSDC, // Integer value in micro USDC
        signature,
        message: messageToSign,
      };
    } catch (error) {
      console.error('Error creating payment payload:', error);
      throw new Error('Failed to create payment payload');
    }
  }

  /**
   * Purchase an article using x402 payment
   */
  async purchaseArticle(
    articleId: number,
    articlePrice: number,
    userAddress: string,
    signMessage: (message: string) => Promise<string>
  ): Promise<PaymentResponse> {
    try {
      // First attempt without payment to trigger 402 response
      const initialResponse = await this.attemptPayment(`/articles/${articleId}/purchase`);

      if (initialResponse.paymentRequired) {
        // Create payment payload - recipient comes from backend 402 response
        const paymentPayload = await this.createPaymentPayload(
          articlePrice,
          initialResponse.paymentRequired.to, // Article author's address from backend
          userAddress,
          signMessage
        );
        console.log('🔍 Created payment payload:', paymentPayload);

        // Retry with payment
        // Verify payment with backend
        const verificationResponse = await this.verifyPayment(paymentPayload, articleId);

        if (verificationResponse.success) {
          return {
            success: true,
            receipt: verificationResponse.receipt
          };
        } else {
          return {
            success: false,
            error: verificationResponse.error || 'Payment verification failed'
          };
        }
      }

      return initialResponse;
    } catch (error) {
      console.error('Article purchase failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
      };
    }
  }

  /**
   * Record article view (NO payment required - views are free)
   */
  async payForView(articleId: number): Promise<PaymentResponse> {
    try {
      // Views are FREE - just increment the counter via API
      await apiService.incrementArticleViews(articleId);

      return {
        success: true,
        receipt: 'View recorded'
      };
    } catch (error) {
      console.error('View tracking failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'View tracking failed',
      };
    }
  }

  /**
   * Check if x402 is supported in the current browser
   * We provide our own x402 implementation, so always return true
   */
  isX402Supported(): boolean {
    // We implement x402 ourselves via wallet signatures
    return true;
  }

  /**
   * Verify payment with backend
   */
  async verifyPayment(paymentPayload: PaymentPayload, articleId: number): Promise<any> {
    try {
      console.log('🔍 Sending payment verification:', {
        paymentPayload,
        articleId
      });

      const response = await fetch('http://localhost:3001/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentPayload,
          articleId
        })
      });

      const result = await response.json();
      console.log('🔍 Verification response:', result);
      return result;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return {
        success: false,
        error: 'Payment verification failed'
      };
    }
  }

  /**
   * Check payment status for a user
   */
  async checkPaymentStatus(articleId: number, userAddress: string): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:3001/api/payment-status/${articleId}/${userAddress}`);
      const data = await response.json();
      return data.success ? data.data.hasPaid : false;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  }

  /**
   * Fallback to regular API payment if x402 is not supported
   */
  async fallbackPurchase(articleId: number): Promise<boolean> {
    try {
      const response = await apiService.recordPurchase(articleId);
      return response.success;
    } catch (error) {
      console.error('Fallback purchase failed:', error);
      return false;
    }
  }
}

export const x402PaymentService = new X402PaymentService();
export default x402PaymentService;
