import { Worker } from "bullmq";
import { redisConnection } from "../config/redis";
import { logger } from "../config/logger";
import { NotificationService } from "../modules/notification/notification.service";

export const notificationWorker = new Worker(
  "notifications",
  async (job) => {
    logger.info(`Processing notification job: ${job.id}`);

    const { notificationId, type, gymId, memberId, title, message } = job.data;

    logger.info({
      type,
      gymId,
      memberId,
      title,
      message,
    });

    /**
     * Future:
     * - Send push notification
     * - Send WhatsApp
     * - Send SMS
     * - Send email
     */

    if (notificationId) {
      await NotificationService.markAsSent(notificationId);
    }

    return true;
  },
  {
    connection: redisConnection,
  }
);