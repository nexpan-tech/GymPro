import crypto from "crypto";
import { AppError } from "../../../utils/response";
import type {
  PaymentGateway,
  CreateOrderInput,
  GatewayOrder,
  VerifyPaymentInput,
  RefundInput,
  RefundResult,
} from "./gateway.interface";

const RAZORPAY_API = "https://api.razorpay.com/v1";

/**
 * Razorpay provider using the REST API + crypto HMAC (no SDK dependency).
 * Signature verification is pure/deterministic so it's unit-testable without keys.
 */
export class RazorpayProvider implements PaymentGateway {
  readonly name = "RAZORPAY";

  private keyId = process.env.RAZORPAY_KEY_ID || "";
  private keySecret = process.env.RAZORPAY_KEY_SECRET || "";
  private webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

  isConfigured(): boolean {
    return Boolean(this.keyId && this.keySecret);
  }

  async createOrder(input: CreateOrderInput): Promise<GatewayOrder> {
    if (!this.isConfigured()) {
      throw new AppError("Razorpay is not configured (missing key id/secret)", 503);
    }

    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
    const res = await fetch(`${RAZORPAY_API}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: input.amountInPaise,
        currency: input.currency ?? "INR",
        receipt: input.receipt,
        notes: input.notes,
      }),
    });

    if (!res.ok) {
      throw new AppError(`Razorpay order creation failed (${res.status})`, 502);
    }

    const order = (await res.json()) as { id: string; amount: number; currency: string };
    return {
      orderId: order.id,
      amountInPaise: order.amount,
      currency: order.currency,
      provider: this.name,
      keyId: this.keyId,
    };
  }

  // Razorpay checkout signature: HMAC_SHA256(order_id|payment_id, key_secret).
  verifyPayment({ orderId, paymentId, signature }: VerifyPaymentInput): boolean {
    if (!this.keySecret) return false;
    const expected = crypto
      .createHmac("sha256", this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    return safeEqual(expected, signature);
  }

  // Webhook signature: HMAC_SHA256(rawBody, webhook_secret).
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.webhookSecret) return false;
    const expected = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(rawBody)
      .digest("hex");
    return safeEqual(expected, signature);
  }

  async refund({ paymentId, amountInPaise }: RefundInput): Promise<RefundResult> {
    // Placeholder — wired to the API but intentionally not exercised in Stage 6.
    if (!this.isConfigured()) {
      throw new AppError("Razorpay is not configured", 503);
    }
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
    const res = await fetch(`${RAZORPAY_API}/payments/${paymentId}/refund`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify(amountInPaise ? { amount: amountInPaise } : {}),
    });
    if (!res.ok) throw new AppError(`Razorpay refund failed (${res.status})`, 502);
    const r = (await res.json()) as { id: string; status: string };
    return { refundId: r.id, status: r.status };
  }
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
