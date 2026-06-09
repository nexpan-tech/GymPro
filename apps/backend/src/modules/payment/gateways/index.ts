import type { PaymentGateway } from "./gateway.interface";
import { RazorpayProvider } from "./razorpay.provider";
import { StripeProvider } from "./stripe.provider";

export * from "./gateway.interface";
export { RazorpayProvider } from "./razorpay.provider";
export { StripeProvider } from "./stripe.provider";

const providers: Record<string, PaymentGateway> = {
  RAZORPAY: new RazorpayProvider(),
  STRIPE: new StripeProvider(),
};

/** Active provider selected via PAYMENT_GATEWAY env (defaults to Razorpay). */
export function getPaymentGateway(name?: string): PaymentGateway {
  const key = (name || process.env.PAYMENT_GATEWAY || "RAZORPAY").toUpperCase();
  return providers[key] ?? providers.RAZORPAY;
}
