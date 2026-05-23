import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function daysBetween(dateA: Date, dateB: Date) {
  return Math.floor(
    (startOfDay(dateA).getTime() - startOfDay(dateB).getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

export class TrainerAnalyticsService {
  static async getOverview(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const trainers = await prisma.user.findMany({
      where: {
        gymId: user.gymId,
        role: "TRAINER",
      },
      include: {
        trainedMembers: {
          include: {
            user: true,
            attendances: true,
            workoutPlans: {
              include: {
                completions: true,
              },
            },
            bodyMeasurements: true,
          },
        },
      },
    });

    return trainers.map((trainer) => {
      const members = trainer.trainedMembers;
      const activeClients = members.length;

      const totalAttendance = members.reduce(
        (sum, member) => sum + member.attendances.length,
        0
      );

      const totalWorkoutPlans = members.reduce(
        (sum, member) => sum + member.workoutPlans.length,
        0
      );

      const totalWorkoutCompletions = members.reduce(
        (sum, member) =>
          sum +
          member.workoutPlans.reduce(
            (inner, plan) => inner + plan.completions.length,
            0
          ),
        0
      );

      const membersWithProgress = members.filter(
        (member) => member.bodyMeasurements.length > 0
      ).length;

      const workoutCompletionRate =
        totalWorkoutPlans > 0
          ? Number(
              ((totalWorkoutCompletions / totalWorkoutPlans) * 100).toFixed(2)
            )
          : 0;

      const transformationTrackingRate =
        activeClients > 0
          ? Number(((membersWithProgress / activeClients) * 100).toFixed(2))
          : 0;

      return {
        trainerId: trainer.id,
        trainerName: trainer.name,
        trainerEmail: trainer.email,
        activeClients,
        totalAttendance,
        totalWorkoutPlans,
        totalWorkoutCompletions,
        workoutCompletionRate,
        transformationTrackingRate,
      };
    });
  }

  static async getLeaderboard(user: AuthUser) {
    const overview = await this.getOverview(user);

    return overview
      .map((trainer) => {
        const score =
          trainer.activeClients * 10 +
          trainer.totalAttendance * 2 +
          trainer.totalWorkoutCompletions * 5 +
          trainer.transformationTrackingRate;

        return {
          ...trainer,
          leaderboardScore: Number(score.toFixed(2)),
        };
      })
      .sort((a, b) => b.leaderboardScore - a.leaderboardScore);
  }

  static async getTrainerDetail(user: AuthUser, trainerId: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const trainer = await prisma.user.findFirst({
      where: {
        id: trainerId,
        gymId: user.gymId,
        role: "TRAINER",
      },
      include: {
        trainedMembers: {
          include: {
            user: true,
            attendances: {
              orderBy: {
                date: "desc",
              },
            },
            workoutPlans: {
              include: {
                exercises: true,
                completions: true,
              },
            },
            bodyMeasurements: {
              orderBy: {
                createdAt: "asc",
              },
            },
            memberships: {
              orderBy: {
                endDate: "desc",
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!trainer) throw new AppError("Trainer not found", 404);

    const today = new Date();

    const clients = trainer.trainedMembers.map((member) => {
      const lastAttendance = member.attendances[0] || null;

      const daysSinceLastAttendance = lastAttendance
        ? daysBetween(today, lastAttendance.date)
        : null;

      const latestMembership = member.memberships[0] || null;

      const membershipActive =
        latestMembership && latestMembership.endDate >= today;

      const workoutCompletionCount = member.workoutPlans.reduce(
        (sum, plan) => sum + plan.completions.length,
        0
      );

      const firstMeasurement = member.bodyMeasurements[0] || null;
      const latestMeasurement =
        member.bodyMeasurements[member.bodyMeasurements.length - 1] || null;

      const weightChange =
        firstMeasurement && latestMeasurement
          ? Number(
              (
                Number(latestMeasurement.weight || 0) -
                Number(firstMeasurement.weight || 0)
              ).toFixed(2)
            )
          : 0;

      return {
        memberId: member.id,
        name: member.user.name,
        email: member.user.email,
        phone: member.phone,
        attendanceCount: member.attendances.length,
        daysSinceLastAttendance,
        workoutPlanCount: member.workoutPlans.length,
        workoutCompletionCount,
        progressEntries: member.bodyMeasurements.length,
        weightChange,
        membershipActive,
      };
    });

    return {
      trainerId: trainer.id,
      trainerName: trainer.name,
      trainerEmail: trainer.email,
      activeClients: clients.length,
      clients,
    };
  }
}