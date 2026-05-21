import { logger } from "../../config/logger";

type SendWhatsAppInput = {
  phone: string;
  message: string;
};

export async function sendWhatsApp(
  input: SendWhatsAppInput
) {
  if (process.env.WHATSAPP_ENABLED !== "true") {
    logger.warn("WhatsApp disabled. Message skipped.", {
      phone: input.phone,
    });

    return {
      skipped: true,
    };
  }

  /**
   * Future:
   * Meta WhatsApp Cloud API
   * Twilio WhatsApp
   */

  logger.info("WhatsApp message queued", {
    phone: input.phone,
    message: input.message,
  });

  return {
    success: true,
  };
}