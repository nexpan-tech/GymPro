import { prisma } from "../config/db";
import { logger } from "../config/logger";

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function daysAgo(days: number) {
  const value = startOfDay();
  value.setDate(value.getDate() - days);
  return value;
}

export const processInactiveMembers = async () => {
  try {
    const sevenDaysAgo = daysAgo(7);
    const fourteenDaysAgo = daysAgo(14);
    const thirtyDaysAgo = daysAgo(30);

    const members = await prisma.member.findMany({
      include: {
        user: true,
        gym: true,
        trainer: true,
        attendances: {
          orderBy: {
            date: "desc",
          },
          take: 1,
        },
      },
    });

    let createdCount = 0;

    for (const member of members) {
      const lastAttendance = member.attendances[0];

      if (!lastAttendance) {
        continue;
      }

      const lastDate = startOfDay(lastAttendance.date);

      let title = "";
      let message = "";

      if (lastDate <= thirtyDaysAgo) {
        title = "Member inactive for 30+ days";
        message = `${member.user.name} has not attended for 30+ days. High churn risk.`;
      } else if (lastDate <= fourteenDaysAgo) {
        title = "Member inactive for 14 days";
        message = `${member.user.name} has not attended for 14 days. Follow up recommended.`;
      } else if (lastDate <= sevenDaysAgo) {
        title = "Member inactive for 7 days";
        message = `${member.user.name} has not attended for 7 days. Send a reminder.`;
      } else {
        continue;
      }

      await prisma.notification.create({
        data: {
          gymId: member.gymId,
          memberId: member.id,
          type: "ATTENDANCE_REMINDER",
          title,
          message,
        },
      });

      createdCount += 1;
    }

    logger.info(`Inactive member alerts created: ${createdCount}`);

    return {
      success: true,
      createdCount,
      scannedMembers: members.length,
    };
  } catch (error) {
    logger.error("Inactive member automation failed", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};