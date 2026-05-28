import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

export class ExperienceService {
  static async personalizedDashboard(user: AuthUser, memberId: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        gymId: user.gymId,
      },
      include: {
        user: true,
        attendances: true,
        payments: true,
        memberships: true,
        workoutPlans: {
          include: {
            completions: true,
          },
        },
        bodyMeasurements: true,
        dietPlan: {
          include: {
            meals: true,
          },
        },
        memberXp: true,
        missionCompletions: true,
        challengeParticipants: {
          include: {
            challenge: true,
          },
        },
      },
    });

    if (!member) throw new AppError("Member not found", 404);

    const totalWorkoutCompletions = member.workoutPlans.reduce(
      (sum, plan) => sum + plan.completions.length,
      0
    );

    const latestMembership = member.memberships.sort(
      (a, b) => b.endDate.getTime() - a.endDate.getTime()
    )[0];

    const latestMeasurement = member.bodyMeasurements.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )[0];

    const totalRevenue = member.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    return {
      member: {
        id: member.id,
        name: member.user.name,
        email: member.user.email,
        fitnessGoal: member.fitnessGoal,
      },
      membership: latestMembership
        ? {
            plan: latestMembership.plan,
            endDate: latestMembership.endDate,
            isActive: latestMembership.endDate >= new Date(),
          }
        : null,
      activity: {
        attendanceCount: member.attendances.length,
        workoutCompletions: totalWorkoutCompletions,
        missionCompletions: member.missionCompletions.length,
        activeChallenges: member.challengeParticipants.filter(
          (p) => !p.isCompleted
        ).length,
      },
      progress: {
        latestWeight: latestMeasurement?.weight || null,
        latestBmi: latestMeasurement?.bmi || null,
        totalMeasurements: member.bodyMeasurements.length,
      },
      gamification: {
        xp: member.memberXp?.xp || 0,
        level: member.memberXp?.level || 1,
        streak: member.memberXp?.streak || 0,
      },
      diet: {
        hasDietPlan: Boolean(member.dietPlan),
        mealCount: member.dietPlan?.meals.length || 0,
      },
      business: {
        totalRevenue,
      },
    };
  }

  static async recommendations(user: AuthUser, memberId: string) {
    const dashboard = await this.personalizedDashboard(user, memberId);

    const recommendations: string[] = [];

    if (!dashboard.membership?.isActive) {
      recommendations.push("Renew your membership to continue your fitness journey.");
    }

    if (dashboard.activity.attendanceCount < 3) {
      recommendations.push("Try to check in at least 3 times this week.");
    }

    if (dashboard.activity.workoutCompletions < 2) {
      recommendations.push("Complete more workout sessions to improve consistency.");
    }

    if (!dashboard.diet.hasDietPlan) {
      recommendations.push("Ask your trainer for a personalized diet plan.");
    }

    if (dashboard.gamification.streak < 3) {
      recommendations.push("Build a 3-day streak to unlock consistency rewards.");
    }

    if (dashboard.activity.activeChallenges === 0) {
      recommendations.push("Join an active challenge to stay motivated.");
    }

    if (recommendations.length === 0) {
      recommendations.push("Great work. Keep your current routine going.");
    }

    return {
      member: dashboard.member,
      recommendations,
    };
  }
}