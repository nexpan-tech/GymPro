import { AppError } from "../../../utils/response";
import type {
  PaymentGateway,
  CreateOrderInput,
  GatewayOrder,
  VerifyPaymentInput,
  RefundInput,
  RefundResult,
} from "./gateway.interface";

/**
 * Stripe provider — intentionally a stub for Stage 6 (future-ready). It satisfies
 * the PaymentGateway contract so the rest of the app can switch providers without
 * code changes, but throws until implemented.
 */
export class StripeProvider implements PaymentGateway {
  readonly name = "STRIPE";

  isConfigured(): boolean {
    return false;
  }

  async createOrder(_input: CreateOrderInput): Promise<GatewayOrder> {
    throw new AppError("Stripe provider is not implemented yet", 501);
  }

  verifyPayment(_input: VerifyPaymentInput): boolean {
    return false;
  }

  verifyWebhookSignature(_rawBody: string, _signature: string): boolean {
    return false;
  }

  async refund(_input: RefundInput): Promise<RefundResult> {
    throw new AppError("Stripe provider is not implemented yet", 501);
  }
}
