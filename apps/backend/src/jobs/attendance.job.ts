import { prisma } from "../config/db";
import { logger } from "../config/logger";

/**
 * Runs daily to process attendance analytics
 * (can be triggered via cron or queue worker)
 */
export const processDailyAttendance = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const attendanceCount = await prisma.attendance.count({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    logger.info(`📊 Today's attendance count: ${attendanceCount}`);

    return {
      success: true,
      count: attendanceCount,
    };
  } catch (error) {
    logger.error("❌ Attendance Job Failed", error);
    return {
      success: false,
    };
  }
};