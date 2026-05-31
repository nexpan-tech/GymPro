import { prisma } from "../../config/db";
import { logger } from "../../config/logger";

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const EXPO_TOKEN_PREFIX = "ExponentPushToken[";
const EXPO_BATCH_SIZE = 100;

function isValidExpoToken(token: string): boolean {
  return token.startsWith(EXPO_TOKEN_PREFIX) && token.endsWith("]");
}

export async function sendPushToToken(
  token: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  if (!isValidExpoToken(token)) {
    logger.warn("Invalid Expo push token format", { token });
    return false;
  }

  try {
    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        title,
        body,
        data: data ?? {},
        sound: "default",
      }),
    });

    if (!response.ok) {
      logger.error("Expo push API returned non-OK status", {
        status: response.status,
        token,
      });
      return false;
    }

    const result = (await response.json()) as {
      data?: { status?: string; message?: string };
    };

    if (result?.data?.status === "error") {
      logger.error("Expo push delivery error", {
        message: result.data.message,
        token,
      });
      return false;
    }

    logger.info("Push notification sent successfully", { token, title });
    return true;
  } catch (err) {
    logger.error("Failed to send push notification", {
      error: (err as Error).message,
      token,
    });
    return false;
  }
}

export async function sendBulkPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const validTokens = tokens.filter(isValidExpoToken);

  if (validTokens.length === 0) {
    logger.warn("sendBulkPush: no valid tokens provided");
    return;
  }

  const batches: string[][] = [];
  for (let i = 0; i < validTokens.length; i += EXPO_BATCH_SIZE) {
    batches.push(validTokens.slice(i, i + EXPO_BATCH_SIZE));
  }

  logger.info("Sending bulk push notifications", {
    total: validTokens.length,
    batches: batches.length,
    title,
  });

  for (const batch of batches) {
    await Promise.all(
      batch.map((token) => sendPushToToken(token, title, body, data))
    );
  }
}

export async function registerToken(
  userId: string,
  token: string,
  platform: string
): Promise<void> {
  await prisma.deviceToken.upsert({
    where: { token },
    update: {
      userId,
      platform,
      updatedAt: new Date(),
    },
    create: {
      userId,
      token,
      platform,
    },
  });

  logger.info("Device token registered", { userId, platform });
}

export async function getTokensForUser(userId: string): Promise<string[]> {
  const records = await prisma.deviceToken.findMany({
    where: { userId },
    select: { token: true },
  });
  return records.map((r) => r.token);
}

/** Convenience wrapper used by notification.job — accepts the {tokens, title, body, data} shape. */
export async function sendPushNotification(payload: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  await sendBulkPush(payload.tokens, payload.title, payload.body, payload.data);
}
