import QRCode from "qrcode";
import { prisma } from "../../config/db";
import { Role, AttendanceSource } from "@prisma/client";
import { startOfDay, addDays } from "../../utils/date";
import { AppError } from "../../utils/response";
import { requireGym } from "../../utils/tenant";
import { emitToGym } from "../../realtime/socket";
import { SOCKET_EVENTS } from "../../realtime/socket-events";

interface AuthUser {
  id: string;
  role: Role;
  gymId: string | null;
}

const memberInclude = {
  member: {
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      trainer: { select: { id: true, name: true, email: true } },
      branch: { select: { id: true, name: true } },
    },
  },
} as const;

/** A member may only check in with a currently-valid (ACTIVE, unexpired) membership. */
async function requireActiveMembership(memberId: string) {
  const active = await prisma.membership.findFirst({
    where: { memberId, status: "ACTIVE", endDate: { gte: new Date() } },
  });
  if (!active) {
    throw new AppError(
      "No active membership. Renew the membership to check in.",
      403
    );
  }
}

/** Broadcast a live occupancy update to everyone in the gym room. */
async function emitOccupancy(gymId: string, type: "checkin" | "checkout") {
  try {
    const occupancy = await prisma.attendance.count({
      where: { gymId, date: startOfDay(), status: "CHECKED_IN" },
    });
    emitToGym(gymId, SOCKET_EVENTS.ATTENDANCE_UPDATE, { type, occupancy });
  } catch {
    // Realtime is best-effort; never block attendance on a socket failure.
  }
}

export class AttendanceService {
  /**
   * Member scans the gym QR (which encodes the gymId) and checks in.
   * Enforces: member role, tenant match, active membership, one session/day.
   */
  static async checkIn(user: AuthUser, scannedGymId: string) {
    if (user.role !== "MEMBER") {
      throw new AppError("Only members can check in using QR scan", 403);
    }

    const gymId = requireGym(user);
    if (gymId !== scannedGymId) {
      throw new AppError("Invalid gym QR — you are not assigned to this gym", 403);
    }

    const member = await prisma.member.findFirst({
      where: { userId: user.id, gymId },
    });
    if (!member) {
      throw new AppError("Member profile not found", 404);
    }

    await requireActiveMembership(member.id);

    return this.recordCheckIn(gymId, member.id, member.branchId, "QR");
  }

  /** ADMIN / RECEPTIONIST manually check a member in. */
  static async manualCheckIn(user: AuthUser, memberId: string) {
    const gymId = requireGym(user);
    if (user.role !== "ADMIN" && user.role !== "RECEPTIONIST") {
      throw new AppError("Only admin or receptionist can mark manual attendance", 403);
    }

    const member = await prisma.member.findFirst({
      where: { id: memberId, gymId },
    });
    if (!member) {
      throw new AppError("Member not found in this gym", 404);
    }

    await requireActiveMembership(member.id);

    const source: AttendanceSource = user.role === "ADMIN" ? "ADMIN" : "MANUAL";
    return this.recordCheckIn(gymId, member.id, member.branchId, source);
  }

  private static async recordCheckIn(
    gymId: string,
    memberId: string,
    branchId: string | null,
    source: AttendanceSource
  ) {
    const today = startOfDay();

    const existing = await prisma.attendance.findFirst({
      where: { gymId, memberId, date: today },
      include: memberInclude,
    });

    if (existing) {
      // Friendly idempotent behaviour: still checked in → return the existing
      // record; already checked out → block a duplicate same-day session.
      if (existing.status === "CHECKED_IN") {
        return { attendance: existing, alreadyCheckedIn: true };
      }
      throw new AppError("Attendance already completed for today", 409);
    }

    const attendance = await prisma.attendance.create({
      data: { gymId, memberId, branchId, date: today, source, status: "CHECKED_IN" },
      include: memberInclude,
    });

    await emitOccupancy(gymId, "checkin");
    return { attendance, alreadyCheckedIn: false };
  }

  /**
   * Member checks themselves out of today's active session.
   * When a scanned gymId is supplied (QR-based checkout), it must match the
   * member's own gym — proving they are physically at the gym to check out.
   */
  static async checkOut(user: AuthUser, scannedGymId?: string) {
    if (user.role !== "MEMBER") {
      throw new AppError("Only members can check out", 403);
    }
    const gymId = requireGym(user);

    if (scannedGymId && scannedGymId !== gymId) {
      throw new AppError("Invalid gym QR — you are not assigned to this gym", 403);
    }

    const member = await prisma.member.findFirst({
      where: { userId: user.id, gymId },
    });
    if (!member) throw new AppError("Member profile not found", 404);

    return this.recordCheckOut(gymId, member.id);
  }

  /** ADMIN / RECEPTIONIST checks a member out. */
  static async checkOutMember(user: AuthUser, memberId: string) {
    const gymId = requireGym(user);
    if (user.role !== "ADMIN" && user.role !== "RECEPTIONIST") {
      throw new AppError("Only admin or receptionist can check members out", 403);
    }
    const member = await prisma.member.findFirst({
      where: { id: memberId, gymId },
    });
    if (!member) throw new AppError("Member not found in this gym", 404);

    return this.recordCheckOut(gymId, memberId);
  }

  private static async recordCheckOut(gymId: string, memberId: string) {
    const today = startOfDay();
    const active = await prisma.attendance.findFirst({
      where: { gymId, memberId, date: today, status: "CHECKED_IN" },
    });
    if (!active) {
      throw new AppError("No active check-in to check out from", 400);
    }

    const attendance = await prisma.attendance.update({
      where: { id: active.id },
      data: { checkOutAt: new Date(), status: "CHECKED_OUT" },
      include: memberInclude,
    });

    await emitOccupancy(gymId, "checkout");
    return { attendance, alreadyCheckedIn: false };
  }

  static async getMyAttendance(user: AuthUser) {
    if (user.role !== "MEMBER") {
      throw new AppError("Only members can access this route", 403);
    }
    const gymId = requireGym(user);
    const member = await prisma.member.findFirst({
      where: { userId: user.id, gymId },
    });
    if (!member) throw new AppError("Member profile not found", 404);

    return prisma.attendance.findMany({
      where: { gymId, memberId: member.id },
      orderBy: { date: "desc" },
    });
  }

  static async getMemberAttendance(user: AuthUser, memberId: string) {
    const gymId = requireGym(user);
    const member = await prisma.member.findFirst({
      where: { id: memberId, gymId },
    });
    if (!member) throw new AppError("Member not found in this gym", 404);

    if (user.role === "TRAINER" && member.trainerId !== user.id) {
      throw new AppError("You can only view assigned member attendance", 403);
    }
    if (user.role === "MEMBER" && member.userId !== user.id) {
      throw new AppError("You can only view your own attendance", 403);
    }

    return prisma.attendance.findMany({
      where: { gymId, memberId },
      orderBy: { date: "desc" },
    });
  }

  static async getDailyAttendance(user: AuthUser, date?: string) {
    const gymId = requireGym(user);
    if (user.role !== "ADMIN" && user.role !== "RECEPTIONIST") {
      throw new AppError("Only admin or receptionist can view daily attendance", 403);
    }
    const targetDate = date ? startOfDay(new Date(date)) : startOfDay();

    return prisma.attendance.findMany({
      where: { gymId, date: targetDate },
      include: memberInclude,
      orderBy: { checkInAt: "desc" },
    });
  }

  /** Members currently inside the gym (today, CHECKED_IN) + occupancy count. */
  static async getLive(user: AuthUser) {
    const gymId = requireGym(user);
    if (user.role !== "ADMIN" && user.role !== "RECEPTIONIST") {
      throw new AppError("Only admin or receptionist can view live occupancy", 403);
    }
    const today = startOfDay();
    const inside = await prisma.attendance.findMany({
      where: { gymId, date: today, status: "CHECKED_IN" },
      include: memberInclude,
      orderBy: { checkInAt: "desc" },
    });
    return { occupancy: inside.length, members: inside };
  }

  static async getAnalytics(user: AuthUser, days = 7) {
    const gymId = requireGym(user);
    if (user.role !== "ADMIN" && user.role !== "RECEPTIONIST") {
      throw new AppError("Only admin or receptionist can view attendance analytics", 403);
    }

    const today = startOfDay();
    const since = startOfDay(addDays(-Math.max(1, days) + 1));

    const [todayRecords, rangeRecords, totalCheckIns] = await Promise.all([
      prisma.attendance.findMany({ where: { gymId, date: today } }),
      prisma.attendance.findMany({
        where: { gymId, date: { gte: since } },
        select: { date: true, checkInAt: true },
      }),
      prisma.attendance.count({ where: { gymId } }),
    ]);

    const currentOccupancy = todayRecords.filter((r) => r.status === "CHECKED_IN").length;

    // Per-day trend over the window
    const trendMap = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const key = startOfDay(addDays(-i)).toISOString().slice(0, 10);
      trendMap.set(key, 0);
    }
    for (const r of rangeRecords) {
      const key = new Date(r.date).toISOString().slice(0, 10);
      if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
    }
    const trend = Array.from(trendMap.entries())
      .map(([date, count]) => ({ date, count }))
      .reverse();

    const avgDailyAttendance =
      trend.length > 0
        ? Math.round(
            (trend.reduce((s, t) => s + t.count, 0) / trend.length) * 10
          ) / 10
        : 0;

    // Peak hours (0-23) by check-in time across the window
    const hours = new Array(24).fill(0) as number[];
    for (const r of rangeRecords) {
      hours[new Date(r.checkInAt).getHours()] += 1;
    }
    const peakHours = hours
      .map((count, hour) => ({ hour, count }))
      .filter((h) => h.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      todayCheckIns: todayRecords.length,
      currentOccupancy,
      totalCheckIns,
      avgDailyAttendance,
      windowDays: days,
      trend,
      peakHours,
    };
  }

  /** Gym admin gets the printable QR for their gym (encodes `gym:<gymId>`). */
  static async getGymQr(user: AuthUser) {
    const gymId = requireGym(user);
    if (user.role !== "ADMIN" && user.role !== "RECEPTIONIST") {
      throw new AppError("Only admin or receptionist can access the gym QR", 403);
    }
    const gym = await prisma.gym.findUnique({
      where: { id: gymId },
      select: { id: true, name: true },
    });
    if (!gym) throw new AppError("Gym not found", 404);

    const qrValue = `gym:${gymId}`;
    const dataUrl = await QRCode.toDataURL(qrValue, { width: 512, margin: 2 });

    return { gymId, gymName: gym.name, qrValue, dataUrl };
  }
}
