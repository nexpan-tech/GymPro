import { prisma } from "../config/db";
import { logger } from "../config/logger";
import { notificationQueue } from "../queues/notification.queue";

/**
 * Stage 7 — Churn Risk Reminder.
 * Uses the persisted riskLevel (set by the nightly score recompute) to alert the
 * gym (admins) about HIGH/CRITICAL members, tagging the assigned trainer when
 * present. Member-scoped notifications, reusing the existing notification queue.
 */
export async function processChurnRiskAlerts() {
  try {
    const atRisk = await prisma.member.findMany({
      where: { riskLevel: { in: ["HIGH", "CRITICAL"] } },
      include: { user: true, trainer: true },
    });

    let createdCount = 0;
    for (const member of atRisk) {
      const trainerSuffix = member.trainer ? ` Assigned trainer: ${member.trainer.name}.` : "";
      const title =
        member.riskLevel === "CRITICAL" ? "Critical churn risk" : "High churn risk";
      const message = `${member.user.name} is at ${member.riskLevel} churn risk (score ${member.riskScore ?? "?"}).${trainerSuffix} Reach out to re-engage.`;

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

    logger.info(`Churn risk alerts created: ${createdCount}`);
    return { success: true, scanned: atRisk.length, createdCount };
  } catch (error) {
    logger.error("Churn risk alert job failed", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
