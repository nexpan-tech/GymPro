import { prisma } from "../../config/db";
import { Role } from "@prisma/client";
import { hashPassword } from "../../utils/password";
import { AppError } from "../../utils/response";
import { requireGym } from "../../utils/tenant";
import {
  CreateMemberInput,
  UpdateMemberInput,
} from "./member.validation";

interface AuthUser {
  id: string;
  role: Role;
  gymId: string | null;
}

const memberInclude = {
  user: true,
  trainer: true,
  branch: true,
} as const;

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
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError("User already exists with this email", 400);
    }

    await assertBranchInGym(gymId, data.branchId);
    await assertTrainerInGym(gymId, data.trainerId);

    const passwordHash = await hashPassword(data.password);

    return prisma.$transaction(async (tx) => {
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

  static async getById(user: AuthUser, id: string) {
    const gymId = requireGym(user);

    const member = await prisma.member.findFirst({
      where: { id, gymId },
      include: {
        user: true,
        trainer: true,
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
}
