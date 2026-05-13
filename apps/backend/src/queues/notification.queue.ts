import { prisma } from "../config/db";
import { logger } from "../config/logger";
import { NOTIFICATION_TYPE } from "../constants/enums";

export interface NotificationJobData {
  gymId: string;
  memberId?: string;
  type: keyof typeof NOTIFICATION_TYPE;
  title: string;
  message: string;
}

/**
 * Create a notification record in the database
 */
export const enqueueNotification = async (
  data: NotificationJobData
): Promise<void> => {
  try {
    await prisma.notification.create({
      data: {
        gymId: data.gymId,
        memberId: data.memberId,
        type: NOTIFICATION_TYPE[data.type],
        title: data.title,
        message: data.message,
        isSent: false,
      },
    });

    logger.info(`Notification queued: ${data.title}`);
  } catch (error) {
    logger.error("Failed to queue notification:", error);
    throw error;
  }
};