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

function diffInDays(a: Date, b: Date) {
  return Math.floor(
    (startOfDay(a).getTime() - startOfDay(b).getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

export class IntelligenceService {
  static async getDashboard(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const [members, payments, attendances, memberships, dues] =
      await Promise.all([
        prisma.member.findMany({ where: { gymId: user.gymId }, include: { user: true } }),
        prisma.payment.findMany({ where: { gymId: user.gymId } }),
        prisma.attendance.findMany({ where: { gymId: user.gymId } }),
        prisma.membership.findMany({ where: { gymId: user.gymId } }),
        prisma.due.findMany({ where: { gymId: user.gymId } }),
      ]);

    const today = new Date();

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingDues = dues.reduce((sum, d) => sum + Number(d.balance || 0), 0);

    const activeMemberships = memberships.filter((m) => m.endDate >= today).length;
    const expiredMemberships = memberships.filter((m) => m.endDate < today).length;

    const churnRiskMembers = members.filter((member) => {
      const memberAttendance = attendances
        .filter((a) => a.memberId === member.id)
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      const lastAttendance = memberAttendance[0];
      const daysSinceLastAttendance = lastAttendance
        ? diffInDays(today, lastAttendance.date)
        : 999;

      return daysSinceLastAttendance >= 14;
    }).length;

    return {
      totalMembers: members.length,
      totalRevenue,
      pendingDues,
      totalAttendance: attendances.length,
      activeMemberships,
      expiredMemberships,
      churnRiskMembers,
      retentionRate:
        memberships.length > 0
          ? Number(((activeMemberships / memberships.length) * 100).toFixed(2))
          : 0,
    };
  }

  static async getRevenueAnalytics(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const payments = await prisma.payment.findMany({
      where: { gymId: user.gymId },
      orderBy: { paidAt: "asc" },
    });

    const dues = await prisma.due.findMany({
      where: { gymId: user.gymId },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingDues = dues.reduce((sum, d) => sum + Number(d.balance || 0), 0);

    const revenueByMethod = payments.reduce<Record<string, number>>((acc, p) => {
      acc[p.method] = (acc[p.method] || 0) + Number(p.amount);
      return acc;
    }, {});

    const revenueTimeline = payments.map((p) => ({
      date: p.paidAt,
      amount: p.amount,
      method: p.method,
      status: p.status,
    }));

    return {
      totalRevenue,
      totalPayments: payments.length,
      pendingDues,
      revenueByMethod,
      revenueTimeline,
    };
  }

  static async getAttendanceAnalytics(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const attendances = await prisma.attendance.findMany({
      where: { gymId: user.gymId },
      include: { member: { include: { user: true } } },
      orderBy: { checkInAt: "asc" },
    });

    const byHour = attendances.reduce<Record<string, number>>((acc, a) => {
      const hour = new Date(a.checkInAt).getHours();
      acc[`${hour}:00`] = (acc[`${hour}:00`] || 0) + 1;
      return acc;
    }, {});

    const byDate = attendances.reduce<Record<string, number>>((acc, a) => {
      const date = a.date.toISOString().slice(0, 10);
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const peakHour =
      Object.entries(byHour).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      totalAttendance: attendances.length,
      peakHour,
      attendanceByHour: byHour,
      attendanceByDate: byDate,
    };
  }

  static async getRetentionAnalytics(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const memberships = await prisma.membership.findMany({
      where: { gymId: user.gymId },
      include: { member: { include: { user: true } } },
    });

    const today = new Date();

    const active = memberships.filter((m) => m.endDate >= today).length;
    const expired = memberships.filter((m) => m.endDate < today).length;

    return {
      totalMemberships: memberships.length,
      active,
      expired,
      retentionRate:
        memberships.length > 0
          ? Number(((active / memberships.length) * 100).toFixed(2))
          : 0,
      expiryList: memberships
        .filter((m) => m.endDate < today)
        .map((m) => ({
          memberId: m.memberId,
          name: m.member.user.name,
          endDate: m.endDate,
          plan: m.plan,
        })),
    };
  }

  static async getChurnAnalytics(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const members = await prisma.member.findMany({
      where: { gymId: user.gymId },
      include: {
        user: true,
        attendances: { orderBy: { date: "desc" }, take: 1 },
        dues: true,
        memberships: { orderBy: { endDate: "desc" }, take: 1 },
      },
    });

    const today = new Date();

    const data = members.map((member) => {
      const lastAttendance = member.attendances[0];
      const daysInactive = lastAttendance
        ? diffInDays(today, lastAttendance.date)
        : 999;

      const pendingDue = member.dues.reduce(
        (sum, due) => sum + Number(due.balance || 0),
        0
      );

      const membershipExpired =
        member.memberships[0] && member.memberships[0].endDate < today;

      let churnScore = 0;
      if (daysInactive >= 30) churnScore += 45;
      else if (daysInactive >= 14) churnScore += 30;
      else if (daysInactive >= 7) churnScore += 15;

      if (pendingDue > 0) churnScore += 25;
      if (membershipExpired) churnScore += 30;

      return {
        memberId: member.id,
        name: member.user.name,
        email: member.user.email,
        daysInactive,
        pendingDue,
        membershipExpired: Boolean(membershipExpired),
        churnScore,
        churnLevel:
          churnScore >= 70 ? "HIGH" : churnScore >= 40 ? "MEDIUM" : "LOW",
        renewalProbability: Math.max(0, 100 - churnScore),
      };
    });

    return data.sort((a, b) => b.churnScore - a.churnScore);
  }

  static async getGrowthAnalytics(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const members = await prisma.member.findMany({
      where: { gymId: user.gymId },
      orderBy: { createdAt: "asc" },
    });

    const growthByMonth = members.reduce<Record<string, number>>((acc, m) => {
      const month = m.createdAt.toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    return {
      totalMembers: members.length,
      growthByMonth,
      latestMonthGrowth: Object.entries(growthByMonth).at(-1) || null,
    };
  }

  static async getGymInsights(user: AuthUser) {
  if (!user.gymId) {
    throw new AppError("Gym context missing", 403);
  }

  const [
    memberships,
    attendances,
    workoutPlans,
    trainers,
    progressEntries,
  ] = await Promise.all([
    prisma.membership.findMany({
      where: { gymId: user.gymId },
    }),

    prisma.attendance.findMany({
      where: { gymId: user.gymId },
    }),

    prisma.workoutPlan.findMany({
      where: { gymId: user.gymId },
    }),

    prisma.user.findMany({
      where: {
        gymId: user.gymId,
        role: "TRAINER",
      },
    }),

    prisma.bodyMeasurement.findMany({
        where: { gymId: user.gymId },
        })
  ]);

  const planPerformance = memberships.reduce<Record<string, number>>(
    (acc, membership) => {
      const key = membership.planId ?? membership.plan ?? "UNSPECIFIED";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {}
  );

  const peakHours = attendances.reduce<Record<string, number>>(
    (acc, attendance) => {
      const hour = new Date(attendance.checkInAt).getHours();

      acc[`${hour}:00`] = (acc[`${hour}:00`] || 0) + 1;

      return acc;
    },
    {}
  );

  const bestPlan =
    Object.entries(planPerformance).sort((a, b) => b[1] - a[1])[0] || null;

  const peakAttendanceTime =
    Object.entries(peakHours).sort((a, b) => b[1] - a[1])[0] || null;

  return {
    bestPerformingPlan: bestPlan,
    peakAttendanceTime,
    totalWorkoutPlans: workoutPlans.length,
    totalTransformations: progressEntries.length,
    activeTrainers: trainers.length,
    planPerformance,
    peakHours,
  };
}

static async getRevenueForecast(user: AuthUser) {
  if (!user.gymId) {
    throw new AppError("Gym context missing", 403);
  }

  const payments = await prisma.payment.findMany({
    where: {
      gymId: user.gymId,
      status: "PAID",
    },
    orderBy: {
      paidAt: "asc",
    },
  });

  const monthlyRevenue = payments.reduce<Record<string, number>>(
    (acc, payment) => {
      const month = payment.paidAt.toISOString().slice(0, 7);

      acc[month] = (acc[month] || 0) + Number(payment.amount);

      return acc;
    },
    {}
  );

  const revenueValues = Object.values(monthlyRevenue);

  const averageRevenue =
    revenueValues.length > 0
      ? revenueValues.reduce((a, b) => a + b, 0) / revenueValues.length
      : 0;

  const projectedNextMonth = Number(
    (averageRevenue * 1.1).toFixed(2)
  );

  return {
    monthlyRevenue,
    averageRevenue: Number(averageRevenue.toFixed(2)),
    projectedNextMonth,
    forecastGrowthPercentage: 10,
  };
}

static async getTrainerPerformance(user: AuthUser) {
  if (!user.gymId) {
    throw new AppError("Gym context missing", 403);
  }

  const trainers = await prisma.user.findMany({
    where: {
      gymId: user.gymId,
      role: "TRAINER",
    },
    include: {
      trainedMembers: {
        include: {
          attendances: true,
          bodyMeasurements: true,
          workoutPlans: true,
        },
      },
    },
  });

  return trainers.map((trainer) => {
    const totalClients = trainer.trainedMembers.length;

    const totalAttendance = trainer.trainedMembers.reduce(
      (sum, member) => sum + member.attendances.length,
      0
    );

    const totalProgress = trainer.trainedMembers.reduce(
      (sum, member) => sum + member.bodyMeasurements.length,
      0
    );

    const totalWorkoutPlans = trainer.trainedMembers.reduce(
      (sum, member) => sum + member.workoutPlans.length,
      0
    );

    const performanceScore =
      totalClients * 20 +
      totalAttendance * 5 +
      totalProgress * 10 +
      totalWorkoutPlans * 15;

    return {
      trainerId: trainer.id,
      trainerName: trainer.name,
      totalClients,
      totalAttendance,
      totalProgress,
      totalWorkoutPlans,
      performanceScore,
    };
  });
}

static async getEngagementScoring(user: AuthUser) {
  if (!user.gymId) {
    throw new AppError("Gym context missing", 403);
  }

  const members = await prisma.member.findMany({
    where: {
      gymId: user.gymId,
    },
    include: {
      user: true,
      attendances: true,
      workoutPlans: {
        include: {
          completions: true,
        },
      },
      bodyMeasurements: true,
      trainerMessages: true,
      dietPlan: {
        include: {
          meals: true,
        },
      },
    },
  });

  return members
    .map((member) => {
      const attendanceCount = member.attendances.length;

      const workoutCompletionCount = member.workoutPlans.reduce(
        (sum, plan) => sum + plan.completions.length,
        0
      );

      const progressEntries = member.bodyMeasurements.length;
      const messageCount = member.trainerMessages.length;
      const mealCount = member.dietPlan?.meals.length || 0;

      let score = 0;

      score += Math.min(attendanceCount * 5, 30);
      score += Math.min(workoutCompletionCount * 15, 25);
      score += Math.min(progressEntries * 10, 20);
      score += Math.min(messageCount * 5, 15);
      score += mealCount > 0 ? 10 : 0;

      const engagementLevel =
        score >= 75 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";

      return {
        memberId: member.id,
        name: member.user.name,
        email: member.user.email,
        attendanceCount,
        workoutCompletionCount,
        progressEntries,
        messageCount,
        mealCount,
        engagementScore: score,
        engagementLevel,
      };
    })
    .sort((a, b) => b.engagementScore - a.engagementScore);
}
}