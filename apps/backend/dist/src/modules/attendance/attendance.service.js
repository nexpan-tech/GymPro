"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const db_1 = require("../../config/db");
const date_1 = require("../../utils/date");
class AttendanceService {
    /**
     * Member check-in (QR scan)
     */
    static async checkIn(gymId, memberId, date) {
        const today = date ? new Date(date) : (0, date_1.startOfDay)();
        // Prevent duplicate check-in
        const existing = await db_1.prisma.attendance.findFirst({
            where: {
                gymId,
                memberId,
                date: today,
            },
        });
        if (existing) {
            throw new Error("Member already checked in today");
        }
        return db_1.prisma.attendance.create({
            data: {
                gymId,
                memberId,
                date: today,
            },
        });
    }
    /**
     * Get attendance history for a member
     */
    static async getMemberAttendance(gymId, memberId) {
        return db_1.prisma.attendance.findMany({
            where: {
                gymId,
                memberId,
            },
            orderBy: {
                date: "desc",
            },
        });
    }
    /**
     * Daily attendance list (gym view)
     */
    static async getDailyAttendance(gymId, date) {
        const targetDate = date ? new Date(date) : (0, date_1.startOfDay)();
        return db_1.prisma.attendance.findMany({
            where: {
                gymId,
                date: targetDate,
            },
            include: {
                member: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }
}
exports.AttendanceService = AttendanceService;
