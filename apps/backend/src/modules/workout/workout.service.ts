import { prisma } from "../../config/db";

export const createWorkoutPlan = async (gymId: string, payload: any) => {
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

export const getWorkoutPlans = async (gymId: string) => {
  return prisma.workoutPlan.findMany({
    where: { gymId },
    include: {
      member: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getWorkoutPlanByMember = async (
  gymId: string,
  memberId: string
) => {
  return prisma.workoutPlan.findFirst({
    where: {
      gymId,
      memberId,
    },
    include: {
      member: {
        include: {
          user: true,
        },
      },
    },
  });
};

export const updateWorkoutPlan = async (
  gymId: string,
  memberId: string,
  payload: any
) => {
  return prisma.workoutPlan.updateMany({
    where: {
      gymId,
      memberId,
    },
    data: payload,
  });
};