import { prisma } from "../../config/db";
import { Role } from "@prisma/client";
import { CreateDietPlanInput, UpdateDietPlanInput } from "./diet.validation";
import { AppError } from "../../utils/response";
import { requireGym } from "../../utils/tenant";

interface AuthUser {
  id: string;
  role: Role;
  gymId: string | null;
}

export class DietService {
  private static async assertMemberAccess(user: AuthUser, memberId: string) {
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
      throw new AppError("You can only manage assigned members", 403);
    }

    if (user.role === "MEMBER" && member.userId !== user.id) {
      throw new AppError("You can only access your own diet plan", 403);
    }

    return member;
  }

  static async create(user: AuthUser, data: CreateDietPlanInput) {
    const gymId = requireGym(user);

    await this.assertMemberAccess(user, data.memberId);

    const existing = await prisma.dietPlan.findUnique({
      where: {
        memberId: data.memberId,
      },
    });

    if (existing) {
      throw new AppError("Diet plan already exists for this member", 400);
    }

    return prisma.dietPlan.create({
      data: {
        gymId,
        memberId: data.memberId,
        goal: data.goal,
        notes: data.notes,
        monday: data.monday,
        tuesday: data.tuesday,
        wednesday: data.wednesday,
        thursday: data.thursday,
        friday: data.friday,
        saturday: data.saturday,
        sunday: data.sunday,
      },
    });
  }

  static async getAll(user: AuthUser) {
    const gymId = requireGym(user);

    return prisma.dietPlan.findMany({
      where: {
        gymId,
        ...(user.role === "TRAINER"
          ? { member: { trainerId: user.id } }
          : {}),
        ...(user.role === "MEMBER"
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
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getByMember(user: AuthUser, memberId: string) {
    const gymId = requireGym(user);

    await this.assertMemberAccess(user, memberId);

    return prisma.dietPlan.findFirst({
      where: {
        gymId,
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
    const gymId = requireGym(user);

    await this.assertMemberAccess(user, memberId);

    const plan = await prisma.dietPlan.findFirst({
      where: {
        gymId,
        memberId,
      },
    });

    if (!plan) {
      throw new AppError("Diet plan not found", 404);
    }

    return prisma.dietPlan.update({
      where: {
        id: plan.id,
      },
      data: {
        goal: data.goal,
        notes: data.notes,
        monday: data.monday,
        tuesday: data.tuesday,
        wednesday: data.wednesday,
        thursday: data.thursday,
        friday: data.friday,
        saturday: data.saturday,
        sunday: data.sunday,
      },
    });
  }

  static async delete(user: AuthUser, memberId: string) {
    const gymId = requireGym(user);

    await this.assertMemberAccess(user, memberId);

    const plan = await prisma.dietPlan.findFirst({
      where: {
        gymId,
        memberId,
      },
    });

    if (!plan) {
      throw new AppError("Diet plan not found", 404);
    }

    return prisma.dietPlan.delete({
      where: {
        id: plan.id,
      },
    });
  }
}