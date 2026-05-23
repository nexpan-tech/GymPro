import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

export class WorkoutService {
  static async createPlan(user: AuthUser, data: any) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.workoutPlan.create({
      data: {
        gymId: user.gymId,
        trainerId: user.id,
        memberId: data.memberId || null,
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        durationWeeks: data.durationWeeks ? Number(data.durationWeeks) : null,
        isTemplate: data.isTemplate ?? false,
      },
      include: {
        trainer: true,
        member: { include: { user: true } },
        exercises: { include: { exercise: true } },
      },
    });
  }

  static async getPlans(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.workoutPlan.findMany({
      where: {
        gymId: user.gymId,
        ...(user.role === "TRAINER" ? { trainerId: user.id } : {}),
        ...(user.role === "MEMBER"
          ? { member: { userId: user.id } }
          : {}),
      },
      include: {
        trainer: true,
        member: { include: { user: true } },
        exercises: { include: { exercise: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getPlanById(user: AuthUser, id: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const plan = await prisma.workoutPlan.findFirst({
      where: {
        id,
        gymId: user.gymId,
        ...(user.role === "TRAINER" ? { trainerId: user.id } : {}),
        ...(user.role === "MEMBER"
          ? { member: { userId: user.id } }
          : {}),
      },
      include: {
        trainer: true,
        member: { include: { user: true } },
        exercises: { include: { exercise: true } },
      },
    });

    if (!plan) throw new AppError("Workout plan not found", 404);

    return plan;
  }

  static async addExercise(user: AuthUser, planId: string, data: any) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const plan = await prisma.workoutPlan.findFirst({
      where: {
        id: planId,
        gymId: user.gymId,
        ...(user.role === "TRAINER" ? { trainerId: user.id } : {}),
      },
    });

    if (!plan) throw new AppError("Workout plan not found or not editable", 404);

    const exercise = await prisma.exercise.findFirst({
      where: {
        id: data.exerciseId,
        OR: [{ isPublic: true }, { gymId: user.gymId }],
      },
    });

    if (!exercise) throw new AppError("Exercise not found", 404);

    return prisma.workoutExercise.create({
      data: {
        workoutPlanId: planId,
        exerciseId: data.exerciseId,
        dayNumber: Number(data.dayNumber),
        sets: Number(data.sets),
        reps: String(data.reps),
        restSeconds:
          data.restSeconds !== undefined ? Number(data.restSeconds) : null,
        notes: data.notes,
      },
      include: {
        exercise: true,
      },
    });
  }

  static async removeExercise(user: AuthUser, id: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const item = await prisma.workoutExercise.findFirst({
      where: {
        id,
        workoutPlan: {
          gymId: user.gymId,
          ...(user.role === "TRAINER" ? { trainerId: user.id } : {}),
        },
      },
    });

    if (!item) throw new AppError("Workout exercise not found", 404);

    return prisma.workoutExercise.delete({
      where: { id },
    });
  }

  static async assignToMember(user: AuthUser, planId: string, memberId: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        gymId: user.gymId,
      },
    });

    if (!member) throw new AppError("Member not found", 404);

    const plan = await prisma.workoutPlan.findFirst({
      where: {
        id: planId,
        gymId: user.gymId,
        ...(user.role === "TRAINER" ? { trainerId: user.id } : {}),
      },
    });

    if (!plan) throw new AppError("Workout plan not found", 404);

    return prisma.workoutPlan.update({
      where: { id: planId },
      data: { memberId },
      include: {
        member: { include: { user: true } },
        exercises: { include: { exercise: true } },
      },
    });
  }

  static async deletePlan(user: AuthUser, id: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const plan = await prisma.workoutPlan.findFirst({
      where: {
        id,
        gymId: user.gymId,
        ...(user.role === "TRAINER" ? { trainerId: user.id } : {}),
      },
    });

    if (!plan) throw new AppError("Workout plan not found", 404);

    return prisma.workoutPlan.delete({
      where: { id },
    });
  }

  static async completeWorkout(user: AuthUser, data: any) {
  if (!user.gymId) throw new AppError("Gym context missing", 403);

  const plan = await prisma.workoutPlan.findFirst({
    where: {
      id: data.workoutPlanId,
      gymId: user.gymId,
    },
    include: {
      member: true,
    },
  });

  if (!plan) throw new AppError("Workout plan not found", 404);

  const member =
    user.role === "MEMBER"
      ? await prisma.member.findFirst({
          where: {
            userId: user.id,
            gymId: user.gymId,
          },
        })
      : await prisma.member.findFirst({
          where: {
            id: data.memberId || plan.memberId || undefined,
            gymId: user.gymId,
          },
        });

  if (!member) throw new AppError("Member not found", 404);

  if (user.role === "MEMBER" && plan.memberId !== member.id) {
    throw new AppError("You can only complete your own workout", 403);
  }

  return prisma.workoutCompletion.create({
    data: {
      gymId: user.gymId,
      memberId: member.id,
      workoutPlanId: plan.id,
      workoutExerciseId: data.workoutExerciseId || null,
      dayNumber: data.dayNumber ? Number(data.dayNumber) : null,
      notes: data.notes,
    },
    include: {
      workoutPlan: true,
      workoutExercise: {
        include: {
          exercise: true,
        },
      },
      member: {
        include: {
          user: true,
        },
      },
    },
  });
}

static async getCompletions(user: AuthUser, workoutPlanId: string) {
  if (!user.gymId) throw new AppError("Gym context missing", 403);

  return prisma.workoutCompletion.findMany({
    where: {
      gymId: user.gymId,
      workoutPlanId,
      ...(user.role === "MEMBER"
        ? {
            member: {
              userId: user.id,
            },
          }
        : {}),
    },
    include: {
      member: {
        include: {
          user: true,
        },
      },
      workoutPlan: true,
      workoutExercise: {
        include: {
          exercise: true,
        },
      },
    },
    orderBy: {
      completedAt: "desc",
    },
  });
}
}