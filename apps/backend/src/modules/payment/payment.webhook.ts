import { Request, Response } from "express";
import { logger } from "../../config/logger";
import { getPaymentGateway } from "./gateways";
import { processWebhookEvent } from "./payment.checkout.service";

/**
 * Razorpay webhook. Verifies the HMAC signature against the RAW body, then
 * reconciles the event with our Payment records (capture → PAID + invoice,
 * failed → OVERDUE). Always 200s on valid-but-unhandled events.
 */
export async function razorpayWebhook(req: Request, res: Response) {
  try {
    const gateway = getPaymentGateway("RAZORPAY");
    const signature = (req.headers["x-razorpay-signature"] as string) || "";

    // Prefer the raw body captured by express.json's verify hook; fall back to
    // re-stringifying (works for tests that post a plain object).
    const rawBody =
      (req as Request & { rawBody?: string }).rawBody ?? JSON.stringify(req.body ?? {});

    if (!gateway.verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    const event = req.body?.event as string;
    const entity =
      req.body?.payload?.payment?.entity ?? req.body?.payload?.order?.entity ?? {};

    logger.info("Razorpay webhook verified", { event });
    const result = await processWebhookEvent(event, entity);

    return res.status(200).json({ success: true, handled: result.handled });
  } catch (error) {
    logger.error("Razorpay webhook failed", error);
    return res.status(500).json({ success: false, message: "Webhook processing failed" });
  }
}
