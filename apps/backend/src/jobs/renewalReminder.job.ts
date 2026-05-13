import { prisma } from "../config/db";
import { logger } from "../config/logger";
import { NOTIFICATION_TYPE, PAYMENT_STATUS } from "../constants/enums";

/**
 * Create membership renewal reminder notifications
 */
export const processRenewalReminders = async () => {
  try {
    const today = new Date();

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    sevenDaysFromNow.setHours(23, 59, 59, 999);

    const expiringMemberships = await prisma.membership.findMany({
      where: {
        endDate: {
          gte: today,
          lte: sevenDaysFromNow,
        },
        paymentStatus: {
          not: PAYMENT_STATUS.PAID,
        },
      },
      select: {
        gymId: true,
        memberId: true,
        endDate: true,
        member: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    let notificationsCreated = 0;

    for (const membership of expiringMemberships) {
      await prisma.notification.create({
        data: {
          gymId: membership.gymId,
          memberId: membership.memberId,
          type: NOTIFICATION_TYPE.MEMBERSHIP_RENEWAL,
          title: "Membership Renewal Reminder",
          message: `Hi ${membership.member.user.name}, your membership will expire on ${membership.endDate.toLocaleDateString()}. Please renew to continue your training without interruption.`,
        },
      });

      notificationsCreated++;
    }

    logger.info(
      `Renewal reminder job completed successfully. ${notificationsCreated} notifications created.`
    );

    return {
      success: true,
      count: notificationsCreated,
    };
  } catch (error) {
    logger.error("Renewal reminder job failed:", error);

    return {
      success: false,
      count: 0,
    };
  }
};