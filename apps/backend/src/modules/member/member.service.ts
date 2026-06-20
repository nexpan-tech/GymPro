import { prisma } from "../../config/db";
import { Role } from "@prisma/client";
import { hashPassword } from "../../utils/password";
import { AppError } from "../../utils/response";
import { requireGym } from "../../utils/tenant";
import { computeAttendanceStreaks } from "../attendance/attendance-streak";
import { LicenseService } from "../license/license.service";
import { ReferralService } from "../referral/referral.service";
import {
  CreateMemberInput,
  UpdateMemberInput,
} from "./member.validation";

interface AuthUser {
  id: string;
  role: Role;
  gymId: string | null;
}

// SECURITY: never include the raw `user` relation (it carries passwordHash).
// Select only safe, non-sensitive identity fields.
const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
} as const;

const memberInclude = {
  user: { select: safeUserSelect },
  trainer: { select: safeUserSelect },
  branch: true,
} as const;

/** Generate a readable one-time temporary password. */
export function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let p = "";
  for (let i = 0; i < 8; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return `Gym-${p}`;
}

async function assertBranchInGym(gymId: string, branchId?: string | null) {
  if (!branchId) return;
  const branch = await prisma.branch.findFirst({ where: { id: branchId, gymId } });
  if (!branch) {
    throw new AppError("Branch not found in this gym", 404);
  }
}

async function assertTrainerInGym(gymId: string, trainerId?: string | null) {
  if (!trainerId) return;
  const trainer = await prisma.user.findFirst({
    where: { id: trainerId, gymId, role: "TRAINER", isActive: true },
  });
  if (!trainer) {
    throw new AppError("Trainer not found in this gym", 404);
  }
}

export class MemberService {
  static async create(gymId: string, data: CreateMemberInput) {
    // SaaS license enforcement: a new member is created ACTIVE (Member.status
    // default), so it consumes a license slot. Block at capacity. No-op for
    // gyms without a capped license (backward compatible).
    await LicenseService.assertCapacity(gymId);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError("User already exists with this email", 400);
    }

    await assertBranchInGym(gymId, data.branchId);
    await assertTrainerInGym(gymId, data.trainerId);

    // Validate any referral code BEFORE creating the member, so an invalid /
    // self / duplicate / cross-gym referral fails cleanly with no partial state.
    const referrer = data.referralCode
      ? await ReferralService.resolveReferrerForRegistration(gymId, data.referralCode, data.email)
      : null;

    const passwordHash = await hashPassword(data.password);

    const member = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: "MEMBER",
          gymId,
          branchId: data.branchId ?? null,
          isActive: true,
        },
      });

      return tx.member.create({
        data: {
          gymId,
          userId: user.id,
          phone: data.phone,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          address: data.address,
          height: data.height,
          weight: data.weight,
          fitnessGoal: data.fitnessGoal,
          branchId: data.branchId ?? null,
          trainerId: data.trainerId,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          healthNotes: data.healthNotes,
          injuryNotes: data.injuryNotes,
          medicalConditions: data.medicalConditions,
        },
        include: memberInclude,
      });
    });

    // Record the PENDING referral after the member exists. Best-effort — a
    // referral hiccup must never fail member creation. Stays PENDING until the
    // member activates their first membership (the only thing that completes it).
    if (referrer) {
      await ReferralService.recordPendingReferral(gymId, referrer, {
        id: member.id, name: data.name, email: data.email, phone: data.phone,
      }).catch(() => undefined);
    }

    return member;
  }

  static async getAll(user: AuthUser, branchId?: string) {
    const gymId = requireGym(user);

    const base =
      user.role === "TRAINER"
        ? { gymId, trainerId: user.id }
        : user.role === "MEMBER"
          ? { gymId, userId: user.id }
          : { gymId };

    const where = branchId ? { ...base, branchId } : base;

    return prisma.member.findMany({
      where,
      include: memberInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  /** The caller's own member profile (MEMBER self-service). */
  static async getMyProfile(user: AuthUser) {
    const gymId = requireGym(user);

    const member = await prisma.member.findFirst({
      where: { userId: user.id, gymId },
      include: {
        user: { select: safeUserSelect },
        trainer: { select: safeUserSelect },
        branch: true,
        memberships: {
          include: { planRef: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!member) {
      throw new AppError("Member profile not found", 404);
    }

    return member;
  }

  /**
   * The logged-in member's attendance streak summary — derived live from
   * Attendance rows (the single source of truth) using the shared operational-
   * day engine. Sundays (and any future configured closed days) never break a
   * streak. Returns current / best / monthly / yearly figures.
   */
  static async getStreak(user: AuthUser) {
    const gymId = requireGym(user);

    const member = await prisma.member.findFirst({
      where: { userId: user.id, gymId },
      select: { id: true },
    });
    if (!member) {
      throw new AppError("Member profile not found", 404);
    }

    const rows = await prisma.attendance.findMany({
      where: { gymId, memberId: member.id },
      select: { date: true },
    });

    return computeAttendanceStreaks(rows.map((r) => r.date));
  }

  static async getById(user: AuthUser, id: string) {
    const gymId = requireGym(user);

    const member = await prisma.member.findFirst({
      where: { id, gymId },
      include: {
        user: { select: safeUserSelect },
        trainer: { select: safeUserSelect },
        branch: true,
        memberships: {
          include: { planRef: true },
          orderBy: { createdAt: "desc" },
        },
        attendances: true,
        dietPlan: true,
        workoutPlans: true,
      },
    });

    if (!member) {
      throw new AppError("Member not found", 404);
    }

    if (user.role === "TRAINER" && member.trainerId !== user.id) {
      throw new AppError("You can only access assigned members", 403);
    }

    if (user.role === "MEMBER" && member.userId !== user.id) {
      throw new AppError("You can only access your own profile", 403);
    }

    return member;
  }

  static async update(gymId: string, id: string, data: UpdateMemberInput) {
    const member = await prisma.member.findFirst({
      where: { id, gymId },
    });

    if (!member) {
      throw new AppError("Member not found", 404);
    }

    await assertBranchInGym(gymId, data.branchId);
    await assertTrainerInGym(gymId, data.trainerId);

    return prisma.$transaction(async (tx) => {
      // Keep the linked User account name/branch/active state in sync.
      const userData: Record<string, unknown> = {};
      if (data.name !== undefined) userData.name = data.name;
      if (data.branchId !== undefined) userData.branchId = data.branchId ?? null;
      if (data.status !== undefined) userData.isActive = data.status === "ACTIVE";
      if (Object.keys(userData).length > 0) {
        await tx.user.update({ where: { id: member.userId }, data: userData });
      }

      return tx.member.update({
        where: { id },
        data: {
          phone: data.phone,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          address: data.address,
          height: data.height,
          weight: data.weight,
          fitnessGoal: data.fitnessGoal,
          branchId: data.branchId,
          trainerId: data.trainerId,
          status: data.status,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          healthNotes: data.healthNotes,
          injuryNotes: data.injuryNotes,
          medicalConditions: data.medicalConditions,
        },
        include: memberInclude,
      });
    });
  }

  /**
   * Soft delete — members accrue memberships/payments/attendance history, so a
   * hard delete would orphan or block on foreign keys. We mark the member
   * INACTIVE and deactivate the linked login instead.
   */
  static async delete(gymId: string, id: string) {
    const member = await prisma.member.findFirst({
      where: { id, gymId },
    });

    if (!member) {
      throw new AppError("Member not found", 404);
    }

    return prisma.$transaction(async (tx) => {
      await tx.member.update({
        where: { id },
        data: { status: "INACTIVE" },
      });

      await tx.user.update({
        where: { id: member.userId },
        data: { isActive: false },
      });

      return { id, status: "INACTIVE" as const };
    });
  }

  /**
   * Reset a member's login password. Sets the supplied password or generates a
   * one-time temporary password (returned ONCE — never stored in plaintext).
   */
  static async resetPassword(gymId: string, id: string, newPassword?: string) {
    const member = await prisma.member.findFirst({ where: { id, gymId } });
    if (!member) throw new AppError("Member not found", 404);

    const temporaryPassword = newPassword?.trim() || generateTempPassword();
    const passwordHash = await hashPassword(temporaryPassword);
    await prisma.user.update({ where: { id: member.userId }, data: { passwordHash } });

    // Returned once so the admin can hand it over; never persisted in clear text.
    return { memberId: id, temporaryPassword, generated: !newPassword };
  }

  /**
   * Hard delete — ONLY allowed when the member has no historical records that
   * would be orphaned. Otherwise the caller must use the soft delete (delete()).
   */
  static async hardDelete(gymId: string, id: string) {
    const member = await prisma.member.findFirst({ where: { id, gymId } });
    if (!member) throw new AppError("Member not found", 404);

    const [memberships, payments, attendance, invoices] = await Promise.all([
      prisma.membership.count({ where: { memberId: id } }),
      prisma.payment.count({ where: { memberId: id } }),
      prisma.attendance.count({ where: { memberId: id } }),
      prisma.invoice.count({ where: { memberId: id } }),
    ]);
    const total = memberships + payments + attendance + invoices;
    if (total > 0) {
      throw new AppError(
        `Member has ${total} historical record(s) (memberships/payments/attendance/invoices). Deactivate instead of deleting.`,
        409,
      );
    }

    return prisma.$transaction(async (tx) => {
      // Remove the member's lightweight dependents first, then the member + login.
      await tx.goal.deleteMany({ where: { memberId: id } });
      await tx.bodyMeasurement.deleteMany({ where: { memberId: id } });
      await tx.notification.deleteMany({ where: { memberId: id } });
      await tx.memberStreak.deleteMany({ where: { memberId: id } });
      await tx.pointTransaction.deleteMany({ where: { memberId: id } });
      await tx.member.delete({ where: { id } });
      await tx.user.delete({ where: { id: member.userId } });
      return { id, deleted: true };
    });
  }
}
