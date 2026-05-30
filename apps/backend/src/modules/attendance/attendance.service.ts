import { prisma } from "../../config/db";
import { Role } from "@prisma/client";
import { startOfDay } from "../../utils/date";
import { AppError } from "../../utils/response";
import { requireGym } from "../../utils/tenant";

interface AuthUser {
  id: string;
  role: Role;
  gymId: string | null;
}

export class AttendanceService {
  static async memberQrCheckIn(user: AuthUser, scannedGymId: string) {
    if (user.role !== "MEMBER") {
      throw new AppError("Only members can check in using QR scan", 403);
    }

    const gymId = requireGym(user);

    if (gymId !== scannedGymId) {
      throw new AppError("Invalid gym QR code", 403);
    }

    const member = await prisma.member.findFirst({
      where: {
        userId: user.id,
        gymId,
      },
    });

    if (!member) {
      throw new AppError("Member profile not found", 404);
    }

    const today = startOfDay();

    const existing = await prisma.attendance.findFirst({
      where: {
        gymId,
        memberId: member.id,
        date: today,
      },
    });

    if (existing) {
      throw new AppError("You have already checked in today", 400);
    }

    return prisma.attendance.create({
      data: {
        gymId,
        memberId: member.id,
        date: today,
      },
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  static async getMyAttendance(user: AuthUser) {
    if (user.role !== "MEMBER") {
      throw new AppError("Only members can access this route", 403);
    }

    const gymId = requireGym(user);

    const member = await prisma.member.findFirst({
      where: {
        userId: user.id,
        gymId,
      },
    });

    if (!member) {
      throw new AppError("Member profile not found", 404);
    }

    return prisma.attendance.findMany({
      where: {
        gymId,
        memberId: member.id,
      },
      orderBy: {
        date: "desc",
      },
    });
  }

  static async getMemberAttendance(user: AuthUser, memberId: string) {
    const gymId = requireGym(user);

    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        gymId,
      },
    });

    if (!member) {
      throw new AppError("Member not found in this gym", 404);
    }

    if (user.role === "TRAINER" && member.trainerId !== user.id) {
      throw new AppError("You can only view assigned member attendance", 403);
    }

    if (user.role === "MEMBER" && member.userId !== user.id) {
      throw new AppError("You can only view your own attendance", 403);
    }

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

  static async getDailyAttendance(user: AuthUser, date?: string) {
    const gymId = requireGym(user);

    if (user.role !== "ADMIN" && user.role !== "RECEPTIONIST") {
      throw new AppError(
        "Only admin or receptionist can view daily attendance",
        403
      );
    }

    const targetDate = date ? new Date(date) : startOfDay();

    return prisma.attendance.findMany({
      where: {
        gymId,
        date: targetDate,
      },
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            trainer: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        checkInAt: "desc",
      },
    });
  }
}