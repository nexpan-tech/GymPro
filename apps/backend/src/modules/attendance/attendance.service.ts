import { prisma } from "../../config/db";
import { startOfDay } from "../../utils/date";

export class AttendanceService {
  /**
   * Member check-in (QR scan)
   */
  static async checkIn(gymId: string, memberId: string, date?: string) {
    const today = date ? new Date(date) : startOfDay();

    // Prevent duplicate check-in
    const existing = await prisma.attendance.findFirst({
      where: {
        gymId,
        memberId,
        date: today,
      },
    });

    if (existing) {
      throw new Error("Member already checked in today");
    }

    return prisma.attendance.create({
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
  static async getMemberAttendance(gymId: string, memberId: string) {
    return prisma.attendance.findMany({
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
  static async getDailyAttendance(gymId: string, date?: string) {
    const targetDate = date ? new Date(date) : startOfDay();

    return prisma.attendance.findMany({
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