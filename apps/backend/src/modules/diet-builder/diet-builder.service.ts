import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

export class DietBuilderService {
  // TRAINER may only target assigned members; ADMIN may target any gym member.
  private static async assertMemberAssignable(user: AuthUser, memberId: string) {
    const member = await prisma.member.findFirst({
      where: { id: memberId, gymId: user.gymId! },
    });
    if (!member) throw new AppError("Member not found", 404);
    if (user.role === "TRAINER" && member.trainerId !== user.id) {
      throw new AppError("You can only create diet plans for assigned clients", 403);
    }
    return member;
  }

  /**
   * Create (or update) a structured diet plan for one or more members.
   *
   * Accepts `memberIds: string[]` (multi-assign) or the legacy single
   * `memberId: string`. DietPlan.memberId is unique, so each member has exactly
   * one structured plan; multi-assign upserts one plan per selected member.
   * Returns the first plan (backward-compatible) plus `plans` + `count`.
   */
  static async createPlan(user: AuthUser, data: any) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const rawIds: string[] = Array.isArray(data.memberIds)
      ? data.memberIds.filter((id: unknown): id is string => typeof id === "string" && !!id)
      : data.memberId
        ? [data.memberId]
        : [];
    const targetIds = [...new Set(rawIds)];
    if (targetIds.length === 0) {
      throw new AppError("Select at least one member to assign this plan to", 400);
    }

    for (const memberId of targetIds) {
      await this.assertMemberAssignable(user, memberId);
    }

    const created = [];
    for (const memberId of targetIds) {
      const plan = await prisma.dietPlan.upsert({
        where: { memberId },
        update: { goal: data.goal, notes: data.notes },
        create: {
          gymId: user.gymId,
          memberId,
          goal: data.goal,
          notes: data.notes,
        },
        include: {
          member: { include: { user: true } },
          meals: true,
        },
      });
      created.push(plan);
    }

    return Object.assign({}, created[0], {
      plans: created,
      count: created.length,
      assignedCount: targetIds.length,
    });
  }

  /** Update plan-level fields (goal / notes). Trainer → assigned members only. */
  static async updatePlan(user: AuthUser, id: string, data: any) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const plan = await prisma.dietPlan.findFirst({
      where: { id, gymId: user.gymId },
      include: { member: true },
    });
    if (!plan) throw new AppError("Diet plan not found", 404);
    if (user.role === "TRAINER" && plan.member.trainerId !== user.id) {
      throw new AppError("You can only update assigned client diet plans", 403);
    }

    return prisma.dietPlan.update({
      where: { id },
      data: { goal: data.goal, notes: data.notes },
      include: { member: { include: { user: true } }, meals: true },
    });
  }

  /**
   * Delete a structured diet plan. Trainer → own assigned members only.
   * Meals + completion records cascade (schema onDelete: Cascade); callers
   * confirm in the UI before invoking.
   */
  static async deletePlan(user: AuthUser, id: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const plan = await prisma.dietPlan.findFirst({
      where: { id, gymId: user.gymId },
      include: { member: true },
    });
    if (!plan) throw new AppError("Diet plan not found", 404);
    if (user.role === "TRAINER" && plan.member.trainerId !== user.id) {
      throw new AppError("You can only delete assigned client diet plans", 403);
    }

    await prisma.dietPlan.delete({ where: { id } });
    return { id };
  }

  static async addMeal(user: AuthUser, dietPlanId: string, data: any) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const dietPlan = await prisma.dietPlan.findFirst({
      where: {
        id: dietPlanId,
        gymId: user.gymId,
      },
      include: {
        member: true,
      },
    });

    if (!dietPlan) throw new AppError("Diet plan not found", 404);

    if (user.role === "TRAINER" && dietPlan.member.trainerId !== user.id) {
      throw new AppError("You can only update assigned client diet plans", 403);
    }

    return prisma.dietMeal.create({
      data: {
        dietPlanId,
        dayOfWeek: data.dayOfWeek,
        mealType: data.mealType,
        title: data.title,
        description: data.description,
        calories:
          data.calories !== undefined ? Number(data.calories) : undefined,
        protein: data.protein !== undefined ? Number(data.protein) : undefined,
        carbs: data.carbs !== undefined ? Number(data.carbs) : undefined,
        fats: data.fats !== undefined ? Number(data.fats) : undefined,
        time: data.time,
      },
    });
  }

  static async getPlans(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.dietPlan.findMany({
      where: {
        gymId: user.gymId,
        ...(user.role === "MEMBER"
          ? {
              member: {
                userId: user.id,
              },
            }
          : {}),
        ...(user.role === "TRAINER"
          ? {
              member: {
                trainerId: user.id,
              },
            }
          : {}),
      },
      include: {
        member: {
          include: {
            user: true,
            trainer: true,
          },
        },
        meals: {
          orderBy: [
            {
              dayOfWeek: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getPlanById(user: AuthUser, id: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const plan = await prisma.dietPlan.findFirst({
      where: {
        id,
        gymId: user.gymId,
        ...(user.role === "MEMBER"
          ? {
              member: {
                userId: user.id,
              },
            }
          : {}),
        ...(user.role === "TRAINER"
          ? {
              member: {
                trainerId: user.id,
              },
            }
          : {}),
      },
      include: {
        member: {
          include: {
            user: true,
            trainer: true,
          },
        },
        meals: true,
      },
    });

    if (!plan) throw new AppError("Diet plan not found", 404);

    return plan;
  }

  static async updateMeal(user: AuthUser, mealId: string, data: any) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const meal = await prisma.dietMeal.findFirst({
      where: {
        id: mealId,
        dietPlan: {
          gymId: user.gymId,
        },
      },
      include: {
        dietPlan: {
          include: {
            member: true,
          },
        },
      },
    });

    if (!meal) throw new AppError("Meal not found", 404);

    if (user.role === "TRAINER" && meal.dietPlan.member.trainerId !== user.id) {
      throw new AppError("You can only update assigned client meals", 403);
    }

    return prisma.dietMeal.update({
      where: {
        id: mealId,
      },
      data: {
        dayOfWeek: data.dayOfWeek,
        mealType: data.mealType,
        title: data.title,
        description: data.description,
        calories:
          data.calories !== undefined ? Number(data.calories) : undefined,
        protein: data.protein !== undefined ? Number(data.protein) : undefined,
        carbs: data.carbs !== undefined ? Number(data.carbs) : undefined,
        fats: data.fats !== undefined ? Number(data.fats) : undefined,
        time: data.time,
      },
    });
  }

  static async deleteMeal(user: AuthUser, mealId: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const meal = await prisma.dietMeal.findFirst({
      where: {
        id: mealId,
        dietPlan: {
          gymId: user.gymId,
        },
      },
      include: {
        dietPlan: {
          include: {
            member: true,
          },
        },
      },
    });

    if (!meal) throw new AppError("Meal not found", 404);

    if (user.role === "TRAINER" && meal.dietPlan.member.trainerId !== user.id) {
      throw new AppError("You can only delete assigned client meals", 403);
    }

    return prisma.dietMeal.delete({
      where: {
        id: mealId,
      },
    });
  }
}