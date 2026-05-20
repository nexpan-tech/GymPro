import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import { requireGym } from "../../utils/tenant";

type AuthRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "RECEPTIONIST"
  | "TRAINER"
  | "MEMBER";

interface AuthUser {
  id: string;
  role: AuthRole;
  gymId: string | null;
}

async function assertMemberAccess(user: AuthUser, memberId: string) {
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
    throw new AppError("You can only access your own workout plan", 403);
  }

  return member;
}

export const createWorkoutPlan = async (
  user: AuthUser,
  payload: any
) => {
  const gymId = requireGym(user);

  await assertMemberAccess(user, payload.memberId);

  const existing = await prisma.workoutPlan.findUnique({
    where: {
      memberId: payload.memberId,
    },
  });

  if (existing) {
    throw new AppError("Workout plan already exists for this member", 400);
  }

  return prisma.workoutPlan.create({
    data: {
      gymId,
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
  const gymId = requireGym(user);

  return prisma.workoutPlan.findMany({
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
};

export const getWorkoutPlanByMember = async (
  user: AuthUser,
  memberId: string
) => {
  const gymId = requireGym(user);

  await assertMemberAccess(user, memberId);

  return prisma.workoutPlan.findFirst({
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
};

export const updateWorkoutPlan = async (
  user: AuthUser,
  memberId: string,
  payload: any
) => {
  const gymId = requireGym(user);

  await assertMemberAccess(user, memberId);

  const plan = await prisma.workoutPlan.findFirst({
    where: {
      gymId,
      memberId,
    },
  });

  if (!plan) {
    throw new AppError("Workout plan not found", 404);
  }

  return prisma.workoutPlan.update({
    where: {
      id: plan.id,
    },
    data: {
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

export const deleteWorkoutPlan = async (
  user: AuthUser,
  memberId: string
) => {
  const gymId = requireGym(user);

  await assertMemberAccess(user, memberId);

  const plan = await prisma.workoutPlan.findFirst({
    where: {
      gymId,
      memberId,
    },
  });

  if (!plan) {
    throw new AppError("Workout plan not found", 404);
  }

  return prisma.workoutPlan.delete({
    where: {
      id: plan.id,
    },
  });
};