import { logger } from "../../config/logger";

type SendSmsInput = {
  phone: string;
  message: string;
};

export async function sendSms(input: SendSmsInput) {
  if (process.env.SMS_ENABLED !== "true") {
    logger.warn("SMS disabled. Message skipped.", {
      phone: input.phone,
    });

    return {
      skipped: true,
    };
  }

  /**
   * Future providers:
   * - MSG91
   * - Twilio
   * - Fast2SMS
   */

  logger.info("SMS message queued", {
    phone: input.phone,
    message: input.message,
  });

  return {
    success: true,
  };
}