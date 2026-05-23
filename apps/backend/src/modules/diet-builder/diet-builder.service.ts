import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

export class DietBuilderService {
  static async createPlan(user: AuthUser, data: any) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const member = await prisma.member.findFirst({
      where: {
        id: data.memberId,
        gymId: user.gymId,
      },
    });

    if (!member) throw new AppError("Member not found", 404);

    if (user.role === "TRAINER" && member.trainerId !== user.id) {
      throw new AppError("You can only create diet plans for assigned clients", 403);
    }

    return prisma.dietPlan.upsert({
      where: {
        memberId: member.id,
      },
      update: {
        goal: data.goal,
        notes: data.notes,
      },
      create: {
        gymId: user.gymId,
        memberId: member.id,
        goal: data.goal,
        notes: data.notes,
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
        meals: true,
      },
    });
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