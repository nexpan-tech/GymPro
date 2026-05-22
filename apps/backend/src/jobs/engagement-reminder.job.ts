import { prisma } from "../config/db";
import { logger } from "../config/logger";
import { notificationQueue } from "../queues/notification.queue";

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function diffInDays(dateA: Date, dateB: Date) {
  const a = startOfDay(dateA).getTime();
  const b = startOfDay(dateB).getTime();

  return Math.floor((a - b) / (1000 * 60 * 60 * 24));
}

async function createAndQueueNotification(input: {
  gymId: string;
  memberId: string;
  title: string;
  message: string;
}) {
  const notification = await prisma.notification.create({
    data: {
      gymId: input.gymId,
      memberId: input.memberId,
      type: "GENERAL",
      title: input.title,
      message: input.message,
    },
  });

  await notificationQueue.add("send-notification", {
    notificationId: notification.id,
    gymId: input.gymId,
    memberId: input.memberId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
  });

  return notification;
}

export async function processEngagementReminders() {
  try {
    const today = startOfDay(new Date());

    const last7Start = new Date(today);
    last7Start.setDate(today.getDate() - 7);

    const previous7Start = new Date(today);
    previous7Start.setDate(today.getDate() - 14);

    const members = await prisma.member.findMany({
      include: {
        user: true,
        attendances: {
          orderBy: {
            date: "desc",
          },
        },
        goals: {
          where: {
            status: "ACTIVE",
          },
        },
      },
    });

    let missedWorkoutCount = 0;
    let goalReminderCount = 0;
    let attendanceDropCount = 0;

    for (const member of members) {
      const latestAttendance = member.attendances[0] || null;

      const daysSinceLastAttendance = latestAttendance
        ? diffInDays(today, latestAttendance.date)
        : null;

      if (daysSinceLastAttendance === null || daysSinceLastAttendance >= 3) {
        await createAndQueueNotification({
          gymId: member.gymId,
          memberId: member.id,
          title: "Missed workout reminder",
          message:
            daysSinceLastAttendance === null
              ? `${member.user.name}, start your fitness journey with your first workout.`
              : `${member.user.name}, you have missed workouts for ${daysSinceLastAttendance} days. Let’s get back on track.`,
        });

        missedWorkoutCount += 1;
      }

      if (member.goals.length > 0) {
        await createAndQueueNotification({
          gymId: member.gymId,
          memberId: member.id,
          title: "Goal reminder",
          message: `${member.user.name}, stay focused on your active fitness goal. Small steps every day create big results.`,
        });

        goalReminderCount += 1;
      }

      const last7Count = member.attendances.filter((attendance) => {
        const date = startOfDay(attendance.date);
        return date >= last7Start && date < today;
      }).length;

      const previous7Count = member.attendances.filter((attendance) => {
        const date = startOfDay(attendance.date);
        return date >= previous7Start && date < last7Start;
      }).length;

      if (previous7Count > 0 && last7Count < previous7Count) {
        const dropPercentage = Number(
          (((previous7Count - last7Count) / previous7Count) * 100).toFixed(2)
        );

        await createAndQueueNotification({
          gymId: member.gymId,
          memberId: member.id,
          title: "Attendance drop alert",
          message: `${member.user.name}, your attendance dropped by ${dropPercentage}%. Your trainer can help you restart your routine.`,
        });

        attendanceDropCount += 1;
      }
    }

    logger.info("Engagement reminders processed", {
      scannedMembers: members.length,
      missedWorkoutCount,
      goalReminderCount,
      attendanceDropCount,
    });

    return {
      success: true,
      scannedMembers: members.length,
      missedWorkoutCount,
      goalReminderCount,
      attendanceDropCount,
    };
  } catch (error) {
    logger.error("Engagement reminder job failed", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}