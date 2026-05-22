import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

type GoalStatus = "ACTIVE" | "COMPLETED" | "FAILED" | "CANCELLED";

export class GoalService {
  private static async getMemberForAccess(user: AuthUser, memberId: string) {
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

    if (user.role === "MEMBER" && member.userId !== user.id) {
      throw new AppError("You can only access your own goals", 403);
    }

    if (user.role === "TRAINER" && member.trainerId !== user.id) {
      throw new AppError("You can only access assigned member goals", 403);
    }

    return member;
  }

  private static calculateProgress(
    currentValue?: number | null,
    targetValue?: number | null
  ) {
    if (!currentValue || !targetValue || targetValue <= 0) return 0;

    const progress = (currentValue / targetValue) * 100;

    return Math.min(Number(progress.toFixed(2)), 100);
  }

  static async create(user: AuthUser, data: any) {
    await this.getMemberForAccess(user, data.memberId);

    return prisma.goal.create({
      data: {
        gymId: user.gymId!,
        memberId: data.memberId,
        title: data.title,
        description: data.description,
        targetValue: data.targetValue ? Number(data.targetValue) : undefined,
        currentValue: data.currentValue ? Number(data.currentValue) : 0,
        unit: data.unit,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        status: data.status || "ACTIVE",
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  static async getAll(user: AuthUser, status?: GoalStatus) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    return prisma.goal.findMany({
      where: {
        gymId: user.gymId,
        ...(status ? { status } : {}),
        ...(user.role === "MEMBER"
          ? { member: { userId: user.id } }
          : {}),
        ...(user.role === "TRAINER"
          ? { member: { trainerId: user.id } }
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
    await this.getMemberForAccess(user, memberId);

    return prisma.goal.findMany({
      where: {
        gymId: user.gymId!,
        memberId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getMyGoals(user: AuthUser) {
    if (user.role !== "MEMBER") {
      throw new AppError("Only members can access this route", 403);
    }

    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    const member = await prisma.member.findFirst({
      where: {
        userId: user.id,
        gymId: user.gymId,
      },
    });

    if (!member) {
      throw new AppError("Member profile not found", 404);
    }

    return this.getByMember(user, member.id);
  }

  static async updateProgress(user: AuthUser, id: string, data: any) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    const goal = await prisma.goal.findFirst({
      where: {
        id,
        gymId: user.gymId,
      },
      include: {
        member: true,
      },
    });

    if (!goal) {
      throw new AppError("Goal not found", 404);
    }

    await this.getMemberForAccess(user, goal.memberId);

    const currentValue =
      data.currentValue !== undefined
        ? Number(data.currentValue)
        : Number(goal.currentValue || 0);

    const progressPercentage = this.calculateProgress(
      currentValue,
      goal.targetValue
    );

    const status: GoalStatus =
      progressPercentage >= 100 ? "COMPLETED" : goal.status;

    return prisma.goal.update({
      where: {
        id,
      },
      data: {
        currentValue,
        status,
      },
    });
  }

  static async updateStatus(user: AuthUser, id: string, status: GoalStatus) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    const goal = await prisma.goal.findFirst({
      where: {
        id,
        gymId: user.gymId,
      },
    });

    if (!goal) {
      throw new AppError("Goal not found", 404);
    }

    await this.getMemberForAccess(user, goal.memberId);

    return prisma.goal.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  }

  static async getGoalSummary(user: AuthUser, memberId: string) {
    await this.getMemberForAccess(user, memberId);

    const goals = await prisma.goal.findMany({
      where: {
        gymId: user.gymId!,
        memberId,
      },
    });

    const activeGoals = goals.filter((goal) => goal.status === "ACTIVE");
    const completedGoals = goals.filter((goal) => goal.status === "COMPLETED");

    return {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      failedGoals: goals.filter((goal) => goal.status === "FAILED").length,
      cancelledGoals: goals.filter((goal) => goal.status === "CANCELLED").length,
      goals: goals.map((goal) => ({
        ...goal,
        progressPercentage: this.calculateProgress(
          goal.currentValue,
          goal.targetValue
        ),
      })),
    };
  }

  static async delete(user: AuthUser, id: string) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    const goal = await prisma.goal.findFirst({
      where: {
        id,
        gymId: user.gymId,
      },
    });

    if (!goal) {
      throw new AppError("Goal not found", 404);
    }

    await this.getMemberForAccess(user, goal.memberId);

    return prisma.goal.delete({
      where: {
        id,
      },
    });
  }
}