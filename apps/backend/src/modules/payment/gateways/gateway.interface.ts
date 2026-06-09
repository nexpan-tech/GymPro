// ── Payment gateway abstraction ──────────────────────────────────────────────
// One interface, multiple providers (Razorpay now, Stripe later). Member checkout
// and SaaS billing both go through this so swapping providers is contained.

export interface CreateOrderInput {
  amountInPaise: number; // smallest currency unit (paise for INR)
  currency?: string; // default INR
  receipt?: string;
  notes?: Record<string, string>;
}

export interface GatewayOrder {
  orderId: string;
  amountInPaise: number;
  currency: string;
  provider: string;
  /** Public key the client SDK needs to open checkout. */
  keyId?: string;
}

export interface VerifyPaymentInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface RefundInput {
  paymentId: string;
  amountInPaise?: number; // omit for full refund
}

export interface RefundResult {
  refundId: string;
  status: string;
}

export interface PaymentGateway {
  readonly name: string;
  /** True when credentials are configured (else create-order should not be called). */
  isConfigured(): boolean;
  createOrder(input: CreateOrderInput): Promise<GatewayOrder>;
  /** Verify the client-side handshake signature (HMAC). Pure, no network. */
  verifyPayment(input: VerifyPaymentInput): boolean;
  /** Verify a server-to-server webhook signature (HMAC). Pure, no network. */
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  refund(input: RefundInput): Promise<RefundResult>;
}
