import { prisma } from "../../config/db";
import { CreateDietPlanInput, UpdateDietPlanInput } from "./diet.validation";
import { AppError } from "../../utils/response";

export class DietService {
  static async create(gymId: string, data: CreateDietPlanInput) {
    const member = await prisma.member.findFirst({
      where: { id: data.memberId, gymId },
    });

    if (!member) {
      throw new AppError("Member not found in this gym", 404);
    }

    const existing = await prisma.dietPlan.findUnique({
      where: { memberId: data.memberId },
    });

    if (existing) {
      throw new AppError("Diet plan already exists for this member", 400);
    }

    return prisma.dietPlan.create({
      data: {
        gymId,
        ...data,
      },
    });
  }

  static async getAll(gymId: string) {
    return prisma.dietPlan.findMany({
      where: { gymId },
      include: {
        member: {
          include: { user: true },
        },
      },
    });
  }

  static async getByMember(gymId: string, memberId: string) {
    return prisma.dietPlan.findFirst({
      where: { gymId, memberId },
    });
  }

  static async update(
    gymId: string,
    memberId: string,
    data: UpdateDietPlanInput
  ) {
    const plan = await prisma.dietPlan.findFirst({
      where: { gymId, memberId },
    });

    if (!plan) {
      throw new AppError("Diet plan not found", 404);
    }

    return prisma.dietPlan.update({
      where: { id: plan.id },
      data,
    });
  }

  static async delete(gymId: string, memberId: string) {
    const plan = await prisma.dietPlan.findFirst({
      where: { gymId, memberId },
    });

    if (!plan) {
      throw new AppError("Diet plan not found", 404);
    }

    return prisma.dietPlan.delete({
      where: { id: plan.id },
    });
  }
}