import { prisma } from "../config/db";
import { logger } from "../config/logger";
import { NotificationService } from "../modules/notification/notification.service";

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

/**
 * Runs daily to detect inactive members
 */
export const processDailyAttendance = async () => {
  try {
    const today = startOfDay();
    const inactiveSince = daysAgo(7);

    const gyms = await prisma.gym.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    let totalInactiveMembers = 0;

    for (const gym of gyms) {
      const activeMembers = await prisma.member.findMany({
        where: {
          gymId: gym.id,
        },
        include: {
          user: true,
          attendances: {
            where: {
              date: {
                gte: inactiveSince,
                lt: today,
              },
            },
          },
        },
      });

      const inactiveMembers = activeMembers.filter(
        (member) => member.attendances.length === 0
      );

      totalInactiveMembers += inactiveMembers.length;

      for (const member of inactiveMembers) {
        await NotificationService.create(gym.id, {
          memberId: member.id,
          type: "ATTENDANCE_REMINDER",
          title: "Member inactive for 7 days",
          message: `${member.user.name} has not checked in for the last 7 days.`,
        });
      }
    }

    logger.info(`Inactive members detected: ${totalInactiveMembers}`);

    return {
      success: true,
      inactiveMembers: totalInactiveMembers,
    };
  } catch (error) {
    logger.error("Attendance automation failed", error);

    return {
      success: false,
    };
  }
};