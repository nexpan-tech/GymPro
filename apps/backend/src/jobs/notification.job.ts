import { Worker } from "bullmq";
import { redisConnection } from "../config/redis";
import { logger } from "../config/logger";
import { prisma } from "../config/db";
import { NotificationService } from "../modules/notification/notification.service";
import { sendEmail } from "../modules/email/email.service";
import { sendWhatsApp } from "../modules/whatsapp/whatsapp.service";
import { sendSms } from "../modules/sms/sms.service";
import { sendPushNotification } from "../modules/push/push.service";

export const notificationWorker = new Worker(
  "notifications",
  async (job) => {
    logger.info(`Processing notification job: ${job.id}`);

    const { notificationId, type, gymId, memberId, title, message } = job.data;

    logger.info("Notification job payload", {
      notificationId,
      type,
      gymId,
      memberId,
      title,
      message,
    });

    if (memberId) {
      const member = await prisma.member.findFirst({
        where: {
          id: memberId,
          gymId,
        },
        include: {
          user: true,
        },
      });

      try {
        if (member?.user?.email) {
          await sendEmail({
            to: member.user.email,
            subject: title || "GymPro Notification",
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>${title || "GymPro Notification"}</h2>
                <p>${message || ""}</p>
                <p style="color:#666;font-size:12px;">
                  This is an automated notification from GymPro.
                </p>
              </div>
            `,
          });
        }
      } catch (error) {
        logger.error("Notification email delivery failed", error);
      }

      try {
        if (member?.phone) {
          await sendWhatsApp({
            phone: member.phone,
            message: message || title || "GymPro notification",
          });
        }
      } catch (error) {
        logger.error("Notification WhatsApp delivery failed", error);
      }

      try {
        if (member?.phone) {
          await sendSms({
            phone: member.phone,
            message: message || title || "GymPro notification",
          });
        }
      } catch (error) {
        logger.error("Notification SMS delivery failed", error);
      }

      try {
        if (member?.userId) {
          const deviceTokens = await prisma.deviceToken.findMany({
            where: {
              userId: member.userId,
            },
          });

          if (deviceTokens.length > 0) {
            await sendPushNotification({
              tokens: deviceTokens.map((device) => device.token),
              title: title || "GymPro Notification",
              body: message || "",
            });
          }
        }
      } catch (error) {
        logger.error("Push notification delivery failed", error);
      }
    }

    if (notificationId) {
      logger.info(`Marking notification as sent: ${notificationId}`);
      await NotificationService.markAsSent(notificationId);
    }

    return true;
  },
  {
    connection: redisConnection,
  }
);