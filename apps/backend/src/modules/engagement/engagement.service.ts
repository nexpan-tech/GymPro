import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import { notificationQueue } from "../../queues/notification.queue";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

function calculateWorkoutStreak(dates: Date[]) {
  if (!dates.length) {
    return {
      currentStreak: 0,
      longestStreak: 0,
    };
  }

  const normalizedDates = [
    ...new Set(
      dates.map((date) =>
        startOfDay(date).toISOString()
      )
    ),
  ]
    .map((date) => new Date(date))
    .sort((a, b) => a.getTime() - b.getTime());

  let longestStreak = 1;
  let currentStreak = 1;
  let runningStreak = 1;

  for (let i = 1; i < normalizedDates.length; i++) {
    const previous = normalizedDates[i - 1];
    const current = normalizedDates[i];

    const diff =
      (current.getTime() - previous.getTime()) /
      (1000 * 60 * 60 * 24);

    if (diff === 1) {
      runningStreak++;

      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      runningStreak = 1;
    }
  }

  const today = startOfDay(new Date());

  currentStreak = 0;

  for (let i = normalizedDates.length - 1; i >= 0; i--) {
    const current = normalizedDates[i];

    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - currentStreak);

    if (
      current.toISOString() === expectedDate.toISOString()
    ) {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    currentStreak,
    longestStreak,
  };
}

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function diffInDays(dateA: Date, dateB: Date) {
  const a = startOfDay(dateA).getTime();
  const b = startOfDay(dateB).getTime();

  return Math.floor((a - b) / (1000 * 60 * 60 * 24));
}

export class EngagementService {
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
      throw new AppError("You can only access your own engagement", 403);
    }

    if (user.role === "TRAINER" && member.trainerId !== user.id) {
      throw new AppError("You can only access assigned member engagement", 403);
    }

    return member;
  }

  private static calculateAttendanceStreak(dates: Date[]) {
    if (dates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
      };
    }

    const uniqueDates = Array.from(
      new Set(dates.map((date) => startOfDay(date).toISOString()))
    )
      .map((date) => new Date(date))
      .sort((a, b) => b.getTime() - a.getTime());

    let currentStreak = 1;
    let longestStreak = 1;
    let tempStreak = 1;

    const today = startOfDay(new Date());
    const latestDate = uniqueDates[0];

    const daysSinceLatest = diffInDays(today, latestDate);

    if (daysSinceLatest > 1) {
      currentStreak = 0;
    }

    for (let i = 1; i < uniqueDates.length; i++) {
      const previousDate = uniqueDates[i - 1];
      const currentDate = uniqueDates[i];

      const diff = diffInDays(previousDate, currentDate);

      if (diff === 1) {
        tempStreak += 1;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    if (currentStreak !== 0) {
      currentStreak = 1;

      for (let i = 1; i < uniqueDates.length; i++) {
        const previousDate = uniqueDates[i - 1];
        const currentDate = uniqueDates[i];

        const diff = diffInDays(previousDate, currentDate);

        if (diff === 1) {
          currentStreak += 1;
        } else {
          break;
        }
      }
    }

    return {
      currentStreak,
      longestStreak,
    };
  }

  static async getAttendanceEngagement(user: AuthUser, memberId: string) {
    await this.getMemberForAccess(user, memberId);

    const attendances = await prisma.attendance.findMany({
      where: {
        gymId: user.gymId!,
        memberId,
      },
      orderBy: {
        date: "desc",
      },
    });

    const attendanceDates = attendances.map((attendance) => attendance.date);
    const streak = this.calculateAttendanceStreak(attendanceDates);

    const lastAttendance = attendances[0] || null;

    const daysSinceLastAttendance = lastAttendance
      ? diffInDays(new Date(), lastAttendance.date)
      : null;

    const engagementScore = Math.min(
      100,
      streak.currentStreak * 10 + attendances.length * 2
    );

    return {
      memberId,
      totalAttendanceDays: attendances.length,
      currentAttendanceStreak: streak.currentStreak,
      longestAttendanceStreak: streak.longestStreak,
      lastAttendanceDate: lastAttendance?.date || null,
      daysSinceLastAttendance,
      engagementScore,
    };
  }

  static async getMyAttendanceEngagement(user: AuthUser) {
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

    return this.getAttendanceEngagement(user, member.id);
  }

  static async getLowEngagementMembers(user: AuthUser) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    const members = await prisma.member.findMany({
      where: {
        gymId: user.gymId,
        ...(user.role === "TRAINER"
          ? {
              trainerId: user.id,
            }
          : {}),
      },
      include: {
        user: true,
        attendances: {
          orderBy: {
            date: "desc",
          },
          take: 5,
        },
      },
    });

    const results = members.map((member) => {
      const attendanceDates = member.attendances.map(
        (attendance) => attendance.date
      );

      const streak = this.calculateAttendanceStreak(attendanceDates);

      const lastAttendance = member.attendances[0] || null;

      const daysSinceLastAttendance = lastAttendance
        ? diffInDays(new Date(), lastAttendance.date)
        : null;

      const engagementScore = Math.min(
        100,
        streak.currentStreak * 10 + member.attendances.length * 2
      );

      return {
        memberId: member.id,
        name: member.user.name,
        email: member.user.email,
        currentAttendanceStreak: streak.currentStreak,
        longestAttendanceStreak: streak.longestStreak,
        daysSinceLastAttendance,
        engagementScore,
      };
    });

    return results
      .filter(
        (member) =>
          member.engagementScore < 30 ||
          member.daysSinceLastAttendance === null ||
          member.daysSinceLastAttendance >= 7
      )
      .sort((a, b) => a.engagementScore - b.engagementScore);
  }

  static async getChurnRiskMembers(user: AuthUser) {
    if (!user.gymId) {
        throw new AppError("Gym context missing", 403);
    }

    const members = await prisma.member.findMany({
        where: {
        gymId: user.gymId,
        ...(user.role === "TRAINER"
            ? {
                trainerId: user.id,
            }
            : {}),
        },
        include: {
        user: true,
        attendances: {
            orderBy: {
            date: "desc",
            },
            take: 5,
        },
        dues: {
            where: {
            status: {
                in: ["PENDING", "PARTIAL", "OVERDUE"],
            },
            balance: {
                gt: 0,
            },
            },
        },
        memberships: {
            orderBy: {
            endDate: "desc",
            },
            take: 1,
        },
        goals: true,
        },
    });

    const today = new Date();

    const results = members.map((member) => {
        const lastAttendance = member.attendances[0] || null;

        const daysSinceLastAttendance = lastAttendance
        ? diffInDays(today, lastAttendance.date)
        : null;

        const activeGoals = member.goals.filter(
        (goal) => goal.status === "ACTIVE"
        ).length;

        const completedGoals = member.goals.filter(
        (goal) => goal.status === "COMPLETED"
        ).length;

        const overdueDues = member.dues.filter(
        (due) => due.status === "OVERDUE"
        );

        const pendingDueAmount = member.dues.reduce(
        (sum, due) => sum + Number(due.balance || 0),
        0
        );

        const latestMembership = member.memberships[0] || null;

        const membershipExpired =
        latestMembership && latestMembership.endDate < today;

        let riskScore = 0;
        const reasons: string[] = [];

        if (daysSinceLastAttendance === null) {
        riskScore += 30;
        reasons.push("No attendance yet");
        } else if (daysSinceLastAttendance >= 30) {
        riskScore += 40;
        reasons.push("Inactive for 30+ days");
        } else if (daysSinceLastAttendance >= 14) {
        riskScore += 25;
        reasons.push("Inactive for 14+ days");
        } else if (daysSinceLastAttendance >= 7) {
        riskScore += 15;
        reasons.push("Inactive for 7+ days");
        }

        if (pendingDueAmount > 0) {
        riskScore += 20;
        reasons.push("Pending dues");
        }

        if (overdueDues.length > 0) {
        riskScore += 25;
        reasons.push("Overdue dues");
        }

        if (membershipExpired) {
        riskScore += 25;
        reasons.push("Membership expired");
        }

        if (activeGoals === 0 && completedGoals === 0) {
        riskScore += 10;
        reasons.push("No goal engagement");
        }

        const riskLevel =
        riskScore >= 70 ? "HIGH" : riskScore >= 40 ? "MEDIUM" : "LOW";

        return {
        memberId: member.id,
        name: member.user.name,
        email: member.user.email,
        phone: member.phone,
        daysSinceLastAttendance,
        pendingDueAmount,
        membershipExpired,
        activeGoals,
        completedGoals,
        riskScore,
        riskLevel,
        reasons,
        };
    });

    return results
        .filter((member) => member.riskScore > 0)
        .sort((a, b) => b.riskScore - a.riskScore);
    }

   static async getAttendanceDropMembers(user: AuthUser) {
    if (!user.gymId) {
        throw new AppError("Gym context missing", 403);
    }

    const today = startOfDay(new Date());

    const last7Start = new Date(today);
    last7Start.setDate(today.getDate() - 7);

    const previous7Start = new Date(today);
    previous7Start.setDate(today.getDate() - 14);

    const members = await prisma.member.findMany({
        where: {
        gymId: user.gymId,
        ...(user.role === "TRAINER"
            ? {
                trainerId: user.id,
            }
            : {}),
        },
        include: {
        user: true,
        attendances: true,
        },
    });

    const results = members.map((member) => {
        const last7Count = member.attendances.filter((attendance) => {
        const date = startOfDay(attendance.date);
        return date >= last7Start && date < today;
        }).length;

        const previous7Count = member.attendances.filter((attendance) => {
        const date = startOfDay(attendance.date);
        return date >= previous7Start && date < last7Start;
        }).length;

        const dropCount = previous7Count - last7Count;

        const dropPercentage =
        previous7Count > 0
            ? Number(((dropCount / previous7Count) * 100).toFixed(2))
            : 0;

        let severity: "NONE" | "LOW" | "MEDIUM" | "HIGH" = "NONE";

        if (previous7Count > 0 && dropPercentage >= 75) {
        severity = "HIGH";
        } else if (previous7Count > 0 && dropPercentage >= 50) {
        severity = "MEDIUM";
        } else if (previous7Count > 0 && dropPercentage > 0) {
        severity = "LOW";
        }

        return {
        memberId: member.id,
        name: member.user.name,
        email: member.user.email,
        phone: member.phone,
        previous7DaysAttendance: previous7Count,
        last7DaysAttendance: last7Count,
        dropCount,
        dropPercentage,
        severity,
        };
    });

    return results
        .filter((member) => member.severity !== "NONE")
        .sort((a, b) => b.dropPercentage - a.dropPercentage);
    }
   
   static async sendEncouragement(
  user: AuthUser,
  data: {
    memberId: string;
    message: string;
  }
) {
  if (!user.gymId) {
    throw new AppError("Gym context missing", 403);
  }

  const member = await prisma.member.findFirst({
    where: {
      id: data.memberId,
      gymId: user.gymId,
      ...(user.role === "TRAINER"
        ? {
            trainerId: user.id,
          }
        : {}),
    },
    include: {
      user: true,
    },
  });

  if (!member) {
    throw new AppError("Member not found or not assigned to you", 404);
  }

  if (!data.message) {
    throw new AppError("Encouragement message is required", 400);
  }

  const notification = await prisma.notification.create({
    data: {
      gymId: user.gymId,
      memberId: member.id,
      type: "GENERAL",
      title: "Message from your trainer",
      message: data.message,
    },
  });

  await notificationQueue.add("send-notification", {
    notificationId: notification.id,
    gymId: user.gymId,
    memberId: member.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
  });

  return notification;
}
  static async getWorkoutStreaks(user: AuthUser) {
  if (!user.gymId) {
    throw new AppError("Gym context missing", 403);
  }

  const members = await prisma.member.findMany({
    where: {
      gymId: user.gymId,
      ...(user.role === "TRAINER"
        ? {
            trainerId: user.id,
          }
        : {}),
    },
    include: {
      user: true,
      attendances: {
        orderBy: {
          date: "asc",
        },
      },
    },
  });

  return members.map((member) => {
    const streaks = calculateWorkoutStreak(
      member.attendances.map((a) => a.date)
    );

    return {
      memberId: member.id,
      name: member.user.name,
      email: member.user.email,
      totalAttendance: member.attendances.length,
      currentWorkoutStreak: streaks.currentStreak,
      longestWorkoutStreak: streaks.longestStreak,
    };
  });
}
}