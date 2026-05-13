import { prisma } from "../config/db";
import { logger } from "../config/logger";

/**
 * Sends pending notifications
 */
export const processNotifications = async () => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        isSent: false,
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
        gym: true,
      },
    });

    for (const n of notifications) {
      // 🚀 Replace this later with SMS / WhatsApp / Push service
      logger.info(
        `📩 Sending notification: ${n.title} -> ${n.member?.user?.name || "ALL"}`
      );

      await prisma.notification.update({
        where: { id: n.id },
        data: {
          isSent: true,
          sentAt: new Date(),
        },
      });
    }

    logger.info(`✅ Notifications processed: ${notifications.length}`);

    return {
      success: true,
      processed: notifications.length,
    };
  } catch (error) {
    logger.error("❌ Notification Job Failed", error);
    return {
      success: false,
    };
  }
};