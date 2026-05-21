import { logger } from "../../config/logger";

type SendPushInput = {
  tokens: string[];
  title: string;
  body: string;
};

export async function sendPushNotification(
  input: SendPushInput
) {
  if (process.env.PUSH_NOTIFICATIONS_ENABLED !== "true") {
    logger.warn("Push notifications disabled.", {
      tokens: input.tokens.length,
    });

    return {
      skipped: true,
    };
  }

  /**
   * Future:
   * Firebase Cloud Messaging
   */

  logger.info("Push notification queued", {
    title: input.title,
    body: input.body,
    tokens: input.tokens.length,
  });

  return {
    success: true,
  };
}