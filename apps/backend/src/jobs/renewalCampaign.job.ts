import { prisma } from "../config/db";
import { logger } from "../config/logger";

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

export const processRenewalCampaigns = async () => {
  try {
    const today = startOfDay();

    const sevenDays = addDays(7);
    const threeDays = addDays(3);
    const oneDay = addDays(1);

    const memberships = await prisma.membership.findMany({
      where: {
        endDate: {
          lte: sevenDays,
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

    for (const membership of memberships) {
      const endDate = startOfDay(membership.endDate);

      let title = "";
      let message = "";

      if (endDate.getTime() <= today.getTime()) {
        title = "Membership expired";
        message = `${membership.member.user.name}'s membership has expired. Contact immediately for renewal.`;
      } else if (endDate.getTime() <= oneDay.getTime()) {
        title = "Membership expires tomorrow";
        message = `${membership.member.user.name}'s membership expires tomorrow.`;
      } else if (endDate.getTime() <= threeDays.getTime()) {
        title = "Membership expires in 3 days";
        message = `${membership.member.user.name}'s membership expires in 3 days.`;
      } else {
        title = "Membership expires in 7 days";
        message = `${membership.member.user.name}'s membership expires in 7 days.`;
      }

      await prisma.notification.create({
        data: {
          gymId: membership.gymId,
          memberId: membership.memberId,
          type: "MEMBERSHIP_RENEWAL",
          title,
          message,
        },
      });

      createdCount += 1;
    }

    logger.info(
      `Renewal campaigns created: ${createdCount}`
    );

    return {
      success: true,
      createdCount,
    };
  } catch (error) {
    logger.error(
      "Renewal campaign automation failed",
      error
    );

    return {
      success: false,
    };
  }
};