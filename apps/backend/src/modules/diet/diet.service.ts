import { Role } from "@prisma/client";
import { prisma } from "../../config/db";
import { CreateDietPlanInput, UpdateDietPlanInput } from "./diet.validation";
import { AppError } from "../../utils/response";

interface AuthUser {
  id: string;
  role: Role;
  gymId: string | null;
}

export class DietService {
  private static async assertMemberAccess(user: AuthUser, memberId: string) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        gymId: user.gymId,
      },
    });

    if (!member) {
      throw new AppError("Member not found in this gym", 404);
    }

    if (user.role === Role.TRAINER && member.trainerId !== user.id) {
      throw new AppError("You can only manage assigned members", 403);
    }

    if (user.role === Role.MEMBER && member.userId !== user.id) {
      throw new AppError("You can only access your own diet plan", 403);
    }

    return member;
  }

  static async create(user: AuthUser, data: CreateDietPlanInput) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    await this.assertMemberAccess(user, data.memberId);

    const existing = await prisma.dietPlan.findUnique({
      where: { memberId: data.memberId },
    });

    if (existing) {
      throw new AppError("Diet plan already exists for this member", 400);
    }

    return prisma.dietPlan.create({
      data: {
        gymId: user.gymId,
        ...data,
      },
    });
  }

  static async getAll(user: AuthUser) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    return prisma.dietPlan.findMany({
      where: {
        gymId: user.gymId,
        ...(user.role === Role.TRAINER
          ? { member: { trainerId: user.id } }
          : {}),
        ...(user.role === Role.MEMBER
          ? { member: { userId: user.id } }
          : {}),
      },
      include: {
        member: {
          include: {
            user: true,
            trainer: true,
          },
        },
      },
    });
  }

  static async getByMember(user: AuthUser, memberId: string) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    await this.assertMemberAccess(user, memberId);

    return prisma.dietPlan.findFirst({
      where: {
        gymId: user.gymId,
        memberId,
      },
      include: {
        member: {
          include: {
            user: true,
            trainer: true,
          },
        },
      },
    });
  }

  static async update(
    user: AuthUser,
    memberId: string,
    data: UpdateDietPlanInput
  ) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    await this.assertMemberAccess(user, memberId);

    const plan = await prisma.dietPlan.findFirst({
      where: {
        gymId: user.gymId,
        memberId,
      },
    });

    if (!plan) {
      throw new AppError("Diet plan not found", 404);
    }

    return prisma.dietPlan.update({
      where: { id: plan.id },
      data,
    });
  }

  static async delete(user: AuthUser, memberId: string) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    await this.assertMemberAccess(user, memberId);

    const plan = await prisma.dietPlan.findFirst({
      where: {
        gymId: user.gymId,
        memberId,
      },
    });

    if (!plan) {
      throw new AppError("Diet plan not found", 404);
    }

    return prisma.dietPlan.delete({
      where: { id: plan.id },
    });
  }
}