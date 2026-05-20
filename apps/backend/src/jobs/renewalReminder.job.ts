import { prisma } from "../config/db";
import { logger } from "../config/logger";
import { NotificationService } from "../modules/notification/notification.service";

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function addDays(days: number) {
  const value = startOfDay();
  value.setDate(value.getDate() + days);
  return value;
}

/**
 * Runs daily to detect memberships expiring soon.
 */
export const processRenewalReminders = async () => {
  try {
    const today = startOfDay();
    const inThreeDays = addDays(3);
    const inSevenDays = addDays(7);

    const expiringMemberships = await prisma.membership.findMany({
      where: {
        paymentStatus: {
          in: ["PAID", "PENDING"],
        },
        endDate: {
          gte: today,
          lte: inSevenDays,
        },
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

    let createdCount = 0;

    for (const membership of expiringMemberships) {
      const memberName = membership.member.user.name;
      const endDate = membership.endDate.toDateString();

      let title = "Membership renewal reminder";
      let message = `${memberName}'s membership expires on ${endDate}.`;

      if (membership.endDate <= inThreeDays) {
        title = "Urgent membership renewal";
        message = `${memberName}'s membership is expiring very soon on ${endDate}. Please follow up.`;
      }

      await NotificationService.create(membership.gymId, {
        memberId: membership.memberId,
        type: "MEMBERSHIP_RENEWAL",
        title,
        message,
      });

      createdCount += 1;
    }

    logger.info(`Renewal reminders created: ${createdCount}`);

    return {
      success: true,
      createdCount,
    };
  } catch (error) {
    logger.error("Renewal reminder automation failed", error);

    return {
      success: false,
    };
  }
};