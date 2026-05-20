import { Role } from "@prisma/client";
import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

interface AuthUser {
  id: string;
  role: Role;
  gymId: string | null;
}

async function assertMemberAccess(user: AuthUser, memberId: string) {
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
    throw new AppError("You can only access your own workout plan", 403);
  }

  return member;
}

export const createWorkoutPlan = async (
  user: AuthUser,
  payload: any
) => {
  if (!user.gymId) {
    throw new AppError("Gym context missing", 403);
  }

  await assertMemberAccess(user, payload.memberId);

  const existing = await prisma.workoutPlan.findUnique({
    where: { memberId: payload.memberId },
  });

  if (existing) {
    throw new AppError("Workout plan already exists for this member", 400);
  }

  return prisma.workoutPlan.create({
    data: {
      gymId: user.gymId,
      memberId: payload.memberId,
      goal: payload.goal,
      monday: payload.monday,
      tuesday: payload.tuesday,
      wednesday: payload.wednesday,
      thursday: payload.thursday,
      friday: payload.friday,
      saturday: payload.saturday,
      sunday: payload.sunday,
      notes: payload.notes,
    },
  });
};

export const getWorkoutPlans = async (user: AuthUser) => {
  if (!user.gymId) {
    throw new AppError("Gym context missing", 403);
  }

  return prisma.workoutPlan.findMany({
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
    orderBy: { createdAt: "desc" },
  });
};

export const getWorkoutPlanByMember = async (
  user: AuthUser,
  memberId: string
) => {
  if (!user.gymId) {
    throw new AppError("Gym context missing", 403);
  }

  await assertMemberAccess(user, memberId);

  return prisma.workoutPlan.findFirst({
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
};

export const updateWorkoutPlan = async (
  user: AuthUser,
  memberId: string,
  payload: any
) => {
  if (!user.gymId) {
    throw new AppError("Gym context missing", 403);
  }

  await assertMemberAccess(user, memberId);

  const plan = await prisma.workoutPlan.findFirst({
    where: {
      gymId: user.gymId,
      memberId,
    },
  });

  if (!plan) {
    throw new AppError("Workout plan not found", 404);
  }

  return prisma.workoutPlan.update({
    where: { id: plan.id },
    data: payload,
  });
};