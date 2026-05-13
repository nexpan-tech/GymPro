"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processDailyAttendance = void 0;
const db_1 = require("../config/db");
const logger_1 = require("../config/logger");
/**
 * Runs daily to process attendance analytics
 * (can be triggered via cron or queue worker)
 */
const processDailyAttendance = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const attendanceCount = await db_1.prisma.attendance.count({
            where: {
                date: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        });
        logger_1.logger.info(`📊 Today's attendance count: ${attendanceCount}`);
        return {
            success: true,
            count: attendanceCount,
        };
    }
    catch (error) {
        logger_1.logger.error("❌ Attendance Job Failed", error);
        return {
            success: false,
        };
    }
};
exports.processDailyAttendance = processDailyAttendance;
