import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import { CreatePlanInput, UpdatePlanInput } from "./membership-plan.validation";

async function assertBranchInGym(gymId: string, branchId?: string | null) {
  if (!branchId) return;
  const branch = await prisma.branch.findFirst({ where: { id: branchId, gymId } });
  if (!branch) {
    throw new AppError("Branch not found in this gym", 404);
  }
}

export class MembershipPlanService {
  static async create(gymId: string, data: CreatePlanInput) {
    await assertBranchInGym(gymId, data.branchId);

    return prisma.gymMembershipPlan.create({
      data: {
        gymId,
        name: data.name,
        description: data.description,
        durationDays: data.durationDays,
        price: data.price,
        branchId: data.branchId ?? null,
        isActive: data.isActive ?? true,
      },
    });
  }

  static async list(gymId: string, includeInactive = true) {
    return prisma.gymMembershipPlan.findMany({
      where: includeInactive ? { gymId } : { gymId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getById(gymId: string, id: string) {
    const plan = await prisma.gymMembershipPlan.findFirst({
      where: { id, gymId },
    });
    if (!plan) throw new AppError("Plan not found", 404);
    return plan;
  }

  static async update(gymId: string, id: string, data: UpdatePlanInput) {
    await this.getById(gymId, id);
    await assertBranchInGym(gymId, data.branchId);

    return prisma.gymMembershipPlan.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        durationDays: data.durationDays,
        price: data.price,
        branchId: data.branchId,
        isActive: data.isActive,
      },
    });
  }

  /**
   * Hard-delete only when the plan was never used; otherwise deactivate it so
   * existing membership history keeps a valid plan reference.
   */
  static async remove(gymId: string, id: string) {
    await this.getById(gymId, id);

    const usage = await prisma.membership.count({ where: { planId: id } });

    if (usage > 0) {
      return prisma.gymMembershipPlan.update({
        where: { id },
        data: { isActive: false },
      });
    }

    await prisma.gymMembershipPlan.delete({ where: { id } });
    return { id, deleted: true };
  }
}
