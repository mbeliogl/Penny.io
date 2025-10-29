// x402 Payment Service for handling micropayments
import { apiService } from './api';

export interface PaymentPayload {
  signature: string;
  authorization: {
    from: string;
    to: string;
    value: string;
    validAfter: number;
    validBefore: number;
    nonce: string;
  };
}

export interface PaymentRequirement {
  price: string;
  network: string;
  facilitator: string;
  to: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentRequired?: PaymentRequirement;
  receipt?: string;
  error?: string;
}

class X402PaymentService {
  private facilitatorUrl = 'https://x402.org/facilitator';
  private network = 'base-sepolia';
  private recipientAddress = '0x742d35Cc6874C298D5C29dAAF7D8a28C1f10b1C3';

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

      const response = await fetch(`http://localhost:3001/api/x402${endpoint}`, {
        method: 'POST',
        headers,
      });

      if (response.status === 402) {
        // Payment required - extract payment requirements
        const paymentData = await response.json();
        return {
          success: false,
          paymentRequired: {
            price: paymentData.price || '$0.01',
            network: this.network,
            facilitator: this.facilitatorUrl,
            to: this.recipientAddress,
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
    userAddress: string,
    signMessage: (message: string) => Promise<string>
  ): Promise<PaymentPayload> {
    try {
      // Convert price to wei (assuming USDC with 6 decimals)
      const valueInCents = Math.round(articlePrice * 100);
      const valueInMicroUSDC = valueInCents * 10000; // Convert to micro USDC

      // Create authorization object
      const authorization = {
        from: userAddress,
        to: this.recipientAddress,
        value: valueInMicroUSDC.toString(),
        validAfter: Math.floor(Date.now() / 1000),
        validBefore: Math.floor(Date.now() / 1000) + 300, // 5 minutes validity
        nonce: this.generateNonce(),
      };

      // Create message to sign (EIP-712 style)
      const messageToSign = this.createSigningMessage(authorization);
      
      // Get signature from user's wallet
      const signature = await signMessage(messageToSign);

      return {
        signature,
        authorization,
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
        // Create payment payload
        const paymentPayload = await this.createPaymentPayload(
          articlePrice,
          userAddress,
          signMessage
        );

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
   * Pay for article view tracking (micro payment)
   */
  async payForView(
    articleId: number,
    userAddress: string,
    signMessage: (message: string) => Promise<string>
  ): Promise<PaymentResponse> {
    try {
      // Create small payment for view tracking ($0.001)
      const paymentPayload = await this.createPaymentPayload(
        0.001,
        userAddress,
        signMessage
      );

      const response = await this.attemptPayment(
        `/articles/${articleId}/view`,
        paymentPayload
      );

      if (response.success) {
        // Also record the view in our database
        await apiService.incrementArticleViews(articleId);
      }

      return response;
    } catch (error) {
      console.error('View payment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'View payment failed',
      };
    }
  }

  /**
   * Generate a unique nonce for the transaction
   */
  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Create the message that needs to be signed for EIP-712
   */
  private createSigningMessage(authorization: any): string {
    return `Authorize payment of ${authorization.value} micro USDC from ${authorization.from} to ${authorization.to} (valid ${authorization.validAfter}-${authorization.validBefore}, nonce: ${authorization.nonce})`;
  }

  /**
   * Check if x402 is supported in the current browser
   */
  isX402Supported(): boolean {
    // Check for Web Monetization API or x402 support
    return 'monetization' in document || 'x402' in window;
  }

  /**
   * Verify payment with backend
   */
  async verifyPayment(paymentPayload: PaymentPayload, articleId: number): Promise<any> {
    try {
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

      return await response.json();
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