import { prisma } from "../config/db";
import { logger } from "../config/logger";
import { notificationQueue } from "../queues/notification.queue";

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function daysBetween(from: Date, to: Date) {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  return Math.floor((a - b) / (1000 * 60 * 60 * 24));
}

export async function processRetentionAlerts() {
  try {
    const members = await prisma.member.findMany({
      include: {
        user: true,
        attendances: {
          orderBy: { date: "desc" },
          take: 1,
        },
        goals: {
          where: { status: "ACTIVE" },
        },
      },
    });

    let createdCount = 0;

    for (const member of members) {
      const lastAttendance = member.attendances[0];
      const daysSinceLastAttendance = lastAttendance
        ? daysBetween(new Date(), lastAttendance.date)
        : null;

      let title = "";
      let message = "";

      if (daysSinceLastAttendance === null) {
        title = "Start your fitness journey";
        message = `${member.user.name}, your gym journey starts with your first check-in.`;
      } else if (daysSinceLastAttendance >= 7) {
        title = "We miss you at the gym";
        message = `${member.user.name}, you have not checked in for ${daysSinceLastAttendance} days. Let's get back on track.`;
      } else if (member.goals.length > 0) {
        title = "Stay focused on your goal";
        message = `${member.user.name}, keep going. Your active fitness goal is waiting for you.`;
      } else {
        continue;
      }

      const notification = await prisma.notification.create({
        data: {
          gymId: member.gymId,
          memberId: member.id,
          type: "GENERAL",
          title,
          message,
        },
      });

      await notificationQueue.add("send-notification", {
        notificationId: notification.id,
        gymId: member.gymId,
        memberId: member.id,
        type: notification.type,
        title,
        message,
      });

      createdCount += 1;
    }

    logger.info(`Retention alerts created: ${createdCount}`);

    return {
      success: true,
      scannedMembers: members.length,
      createdCount,
    };
  } catch (error) {
    logger.error("Retention alert job failed", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}