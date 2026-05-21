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

export const processDueReminders = async () => {
  try {
    const today = startOfDay();
    const nextSevenDays = addDays(7);

    const dues = await prisma.due.findMany({
      where: {
        status: {
          in: ["PENDING", "PARTIAL", "OVERDUE"],
        },
        balance: {
          gt: 0,
        },
        dueDate: {
          lte: nextSevenDays,
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
    let failedCount = 0;

    for (const due of dues) {
      try {
        const isOverdue = due.dueDate < today;

        const title = isOverdue
          ? "Overdue payment reminder"
          : "Upcoming payment reminder";

        const message = isOverdue
          ? `${due.member.user.name} has an overdue balance of ₹${due.balance}. Please follow up.`
          : `${due.member.user.name} has a pending balance of ₹${due.balance} due on ${due.dueDate.toDateString()}.`;

        await prisma.notification.create({
          data: {
            gymId: due.gymId,
            memberId: due.memberId,
            type: "PAYMENT_REMINDER",
            title,
            message,
          },
        });

        await prisma.due.update({
          where: {
            id: due.id,
          },
          data: {
            reminderCount: {
              increment: 1,
            },
            lastReminderAt: new Date(),
            status: isOverdue ? "OVERDUE" : due.status,
          },
        });

        createdCount += 1;
      } catch (error) {
        failedCount += 1;
        logger.error("Single due reminder failed", error);
      }
    }

    logger.info(`Due reminders created: ${createdCount}`);

    return {
      success: true,
      createdCount,
      failedCount,
      scannedCount: dues.length,
    };
  } catch (error) {
    logger.error("Due reminder automation failed", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};