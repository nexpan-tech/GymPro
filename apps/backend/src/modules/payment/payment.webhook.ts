import { Request, Response } from "express";
import crypto from "crypto";
import { logger } from "../../config/logger";

export async function razorpayWebhook(req: Request, res: Response) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Webhook secret not configured",
      });
    }

    const signature = req.headers["x-razorpay-signature"] as string;

    const body = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    logger.info("Razorpay webhook received", {
      event: req.body.event,
    });

    return res.status(200).json({
      success: true,
      message: "Webhook received",
    });
  } catch (error) {
    logger.error("Razorpay webhook failed", error);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
}