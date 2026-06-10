import { prisma } from "../config/db";
import { logger } from "../config/logger";

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Stage 7 — Trial Conversion Reminder.
 * Finds ACTIVE trials ending within 2 days and notifies the gym (lead owner /
 * receptionist) to follow up and convert. Also flips lapsed trials to EXPIRED.
 */
export async function processTrialConversionReminders() {
  try {
    const now = new Date();
    const inTwoDays = startOfDay(now);
    inTwoDays.setDate(inTwoDays.getDate() + 2);

    // Lapse expired trials first.
    const expired = await prisma.trialMembership.updateMany({
      where: { status: "ACTIVE", endDate: { lt: now } },
      data: { status: "EXPIRED" },
    });

    const endingSoon = await prisma.trialMembership.findMany({
      where: { status: "ACTIVE", endDate: { gte: now, lte: inTwoDays } },
      include: { lead: true, member: { include: { user: true } } },
    });

    let createdCount = 0;
    for (const trial of endingSoon) {
      const name = trial.lead?.name ?? trial.member?.user?.name ?? "Trial user";
      await prisma.notification.create({
        data: {
          gymId: trial.gymId,
          memberId: trial.memberId ?? undefined,
          type: "GENERAL",
          title: "Trial ending soon — convert",
          message: `${name}'s trial ends ${trial.endDate.toDateString()}. Follow up to convert to a paid membership.`,
        },
      });
      createdCount += 1;
    }

    logger.info(`Trial conversion reminders created: ${createdCount}; trials expired: ${expired.count}`);
    return { success: true, expired: expired.count, createdCount };
  } catch (error) {
    logger.error("Trial conversion reminder job failed", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
