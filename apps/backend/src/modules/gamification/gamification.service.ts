import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import { PointsService } from "./points.service";
import { StreakService } from "./streak.service";
import { NotificationService } from "../notification/notification.service";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

function calculateLevel(xp: number) {
  return Math.floor(xp / 100) + 1;
}

export class GamificationService {
  static async addXp(user: AuthUser, memberId: string, xpAmount: number) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const member = await prisma.member.findFirst({
      where: { id: memberId, gymId: user.gymId },
    });

    if (!member) throw new AppError("Member not found", 404);

    const current = await prisma.memberXP.findUnique({
      where: { memberId },
    });

    const newXp = (current?.xp || 0) + xpAmount;
    const newLevel = calculateLevel(newXp);

    return prisma.memberXP.upsert({
      where: { memberId },
      update: {
        xp: newXp,
        level: newLevel,
      },
      create: {
        gymId: user.gymId,
        memberId,
        xp: newXp,
        level: newLevel,
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

  static async getMemberXp(user: AuthUser, memberId: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.memberXP.findUnique({
      where: { memberId },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  static async createMission(user: AuthUser, data: any) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.dailyMission.create({
      data: {
        gymId: user.gymId,
        title: data.title,
        description: data.description,
        type: data.type,
        xpReward: data.xpReward || 10,
      },
    });
  }

  static async getMissions(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.dailyMission.findMany({
      where: {
        gymId: user.gymId,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async completeMission(user: AuthUser, missionId: string, memberId: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const mission = await prisma.dailyMission.findFirst({
      where: {
        id: missionId,
        gymId: user.gymId,
        isActive: true,
      },
    });

    if (!mission) throw new AppError("Mission not found", 404);

    const completion = await prisma.missionCompletion.create({
      data: {
        missionId,
        memberId,
      },
      include: {
        mission: true,
        member: {
          include: {
            user: true,
          },
        },
      },
    });

    const xp = await this.addXp(user, memberId, mission.xpReward);

    return {
      completion,
      xp,
    };
  }

  static async createReward(user: AuthUser, data: any) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.reward.create({
      data: {
        gymId: user.gymId,
        title: data.title,
        description: data.description,
        type: data.type,
        // Stage 8 — points cost is the canonical spend; keep xpCost as a mirror.
        pointsCost: Number(data.pointsCost ?? data.xpCost ?? 0),
        xpCost: data.xpCost ?? data.pointsCost ?? null,
        stock: data.stock === undefined || data.stock === null ? null : Number(data.stock),
      },
    });
  }

  static async getRewards(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.reward.findMany({
      where: {
        gymId: user.gymId,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async updateStreak(user: AuthUser, memberId: string) {
  if (!user.gymId) throw new AppError("Gym context missing", 403);

  const member = await prisma.member.findFirst({
    where: { id: memberId, gymId: user.gymId },
  });

  if (!member) throw new AppError("Member not found", 404);

  const current = await prisma.memberXP.findUnique({
    where: { memberId },
  });

  const newStreak = (current?.streak || 0) + 1;
  const bonusXp = newStreak % 7 === 0 ? 50 : 10;

  const newXp = (current?.xp || 0) + bonusXp;
  const newLevel = calculateLevel(newXp);

  return prisma.memberXP.upsert({
    where: { memberId },
    update: {
      streak: newStreak,
      xp: newXp,
      level: newLevel,
    },
    create: {
      gymId: user.gymId,
      memberId,
      streak: newStreak,
      xp: newXp,
      level: newLevel,
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

  // ── Stage 8 — points/streak summary, redemption, leaderboard, analytics ─────

  private static async resolveMember(user: AuthUser, memberId?: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    if (user.role === "MEMBER") {
      const m = await prisma.member.findFirst({ where: { userId: user.id, gymId: user.gymId } });
      if (!m) throw new AppError("Member profile not found", 404);
      return m;
    }
    if (!memberId) throw new AppError("memberId is required", 400);
    const m = await prisma.member.findFirst({ where: { id: memberId, gymId: user.gymId } });
    if (!m) throw new AppError("Member not found", 404);
    return m;
  }

  /** Member's engagement summary: points balance, level, streaks, badges. */
  static async getSummary(user: AuthUser, memberId?: string) {
    const member = await this.resolveMember(user, memberId);
    const [summary, streaks, badgeCount] = await Promise.all([
      PointsService.summary(member.id),
      StreakService.getMemberStreaks(user.gymId!, member.id),
      prisma.memberBadge.count({ where: { memberId: member.id } }),
    ]);
    return { memberId: member.id, ...summary, streaks, badgeCount };
  }

  static async getPointHistory(user: AuthUser, memberId?: string) {
    const member = await this.resolveMember(user, memberId);
    return PointsService.history(user.gymId!, member.id);
  }

  /** Member redeems a reward — validates points, spends, records redemption. */
  static async redeemReward(user: AuthUser, rewardId: string, memberId?: string) {
    const member = await this.resolveMember(user, memberId);
    const reward = await prisma.reward.findFirst({ where: { id: rewardId, gymId: user.gymId! } });
    if (!reward) throw new AppError("Reward not found", 404);
    if (!reward.isActive) throw new AppError("Reward is not available", 400);
    if (reward.stock !== null && reward.stock <= 0) throw new AppError("Reward is out of stock", 400);

    const cost = reward.pointsCost || reward.xpCost || 0;

    // Pre-check balance so we never create an orphaned redemption row.
    const balance = await PointsService.balance(member.id);
    if (balance < cost) {
      throw new AppError(`Not enough points (have ${balance}, need ${cost})`, 400);
    }

    const redemption = await prisma.rewardRedemption.create({
      data: { gymId: user.gymId!, memberId: member.id, rewardId, pointsSpent: cost, status: "PENDING" },
    });

    // Spend points (throws if balance too low) — idempotency-keyed to redemption.
    await PointsService.spend({
      gymId: user.gymId!,
      memberId: member.id,
      points: cost,
      refType: "rewardRedemption",
      refId: redemption.id,
      eventKey: `REWARD_REDEEMED:${redemption.id}`,
    });

    if (reward.stock !== null) {
      await prisma.reward.update({ where: { id: rewardId }, data: { stock: { decrement: 1 } } });
    }

    await NotificationService.create(user.gymId!, {
      memberId: member.id,
      type: "GENERAL",
      title: "🎁 Reward redeemed",
      message: `You redeemed "${reward.title}" for ${cost} points.`,
    }).catch(() => undefined);

    return { redemption, reward, balance: await PointsService.balance(member.id) };
  }

  static async listRedemptions(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    return prisma.rewardRedemption.findMany({
      where: { gymId: user.gymId },
      include: { reward: true, member: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  static async myRedemptions(user: AuthUser) {
    const member = await this.resolveMember(user);
    return prisma.rewardRedemption.findMany({
      where: { gymId: user.gymId!, memberId: member.id },
      include: { reward: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static async updateRedemptionStatus(user: AuthUser, id: string, status: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const existing = await prisma.rewardRedemption.findFirst({ where: { id, gymId: user.gymId } });
    if (!existing) throw new AppError("Redemption not found", 404);
    return prisma.rewardRedemption.update({ where: { id }, data: { status: status as never } });
  }

  /**
   * Leaderboards — scope GYM (points), BRANCH (points within a branch), or
   * CHALLENGE (challenge progress). Always gym-scoped (no cross-gym leakage).
   */
  static async leaderboard(user: AuthUser, scope: string, refId?: string, limit = 20) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    if (scope === "CHALLENGE") {
      if (!refId) throw new AppError("challengeId required for CHALLENGE scope", 400);
      const challenge = await prisma.challenge.findFirst({ where: { id: refId, gymId: user.gymId } });
      if (!challenge) throw new AppError("Challenge not found", 404);
      const parts = await prisma.challengeParticipant.findMany({
        where: { challengeId: refId },
        include: { member: { include: { user: true } } },
        orderBy: [{ isCompleted: "desc" }, { progress: "desc" }],
        take: limit,
      });
      return parts.map((p, i) => ({
        rank: i + 1,
        memberId: p.memberId,
        name: p.member.user.name,
        progress: p.progress,
        isCompleted: p.isCompleted,
      }));
    }

    // GYM / BRANCH — rank members by lifetime points (MemberXP).
    const memberWhere =
      scope === "BRANCH" && refId ? { gymId: user.gymId, branchId: refId } : { gymId: user.gymId };
    const members = await prisma.member.findMany({ where: memberWhere, select: { id: true } });
    const memberIds = members.map((m) => m.id);
    const xps = await prisma.memberXP.findMany({
      where: { gymId: user.gymId, memberId: { in: memberIds } },
      include: { member: { include: { user: true } } },
      orderBy: [{ xp: "desc" }],
      take: limit,
    });
    return xps.map((x, i) => ({
      rank: i + 1,
      memberId: x.memberId,
      name: x.member.user.name,
      xp: x.xp,
      level: x.level,
      streak: x.streak,
    }));
  }

  /** Trainer view: assigned members' streaks + points, flagged for motivation. */
  static async getTrainerMembers(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const members = await prisma.member.findMany({
      where: { gymId: user.gymId, trainerId: user.id },
      include: { user: true, memberXp: true, streaks: true, challengeParticipants: true },
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return members
      .map((m) => {
        const attendance = m.streaks.find((s) => s.type === "ATTENDANCE");
        const last = attendance?.lastActivityDate ? new Date(attendance.lastActivityDate) : null;
        const daysSince = last ? Math.floor((today.getTime() - new Date(last.setHours(0, 0, 0, 0)).getTime()) / 86_400_000) : null;
        const attendanceStreak = daysSince !== null && daysSince <= 1 ? (attendance?.current ?? 0) : 0;
        const activeChallenges = m.challengeParticipants.filter((p) => !p.isCompleted).length;
        return {
          memberId: m.id,
          name: m.user.name,
          points: m.memberXp?.xp ?? 0,
          level: m.memberXp?.level ?? 1,
          attendanceStreak,
          workoutStreak: m.streaks.find((s) => s.type === "WORKOUT")?.current ?? 0,
          dietStreak: m.streaks.find((s) => s.type === "DIET")?.current ?? 0,
          activeChallenges,
          needsMotivation: attendanceStreak === 0 || (daysSince ?? 99) >= 5,
        };
      })
      .sort((a, b) => Number(b.needsMotivation) - Number(a.needsMotivation));
  }

  /** Platform engagement rollup (SUPER_ADMIN). */
  static async getPlatformEngagement() {
    const [gyms, participants, redemptions, referrals, xpAgg] = await Promise.all([
      prisma.gym.findMany({ select: { id: true, name: true } }),
      prisma.challengeParticipant.findMany({ include: { challenge: { select: { gymId: true } } } }),
      prisma.rewardRedemption.findMany({ select: { gymId: true } }),
      prisma.referral.findMany({ select: { gymId: true, status: true } }),
      prisma.memberXP.aggregate({ _sum: { xp: true }, _avg: { level: true } }),
    ]);
    const perGym = gyms
      .map((g) => ({
        gymId: g.id,
        name: g.name,
        participations: participants.filter((p) => p.challenge.gymId === g.id).length,
        redemptions: redemptions.filter((r) => r.gymId === g.id).length,
        referrals: referrals.filter((r) => r.gymId === g.id).length,
      }))
      .sort((a, b) => b.participations - a.participations);
    const convertedReferrals = referrals.filter((r) => r.status === "CONVERTED" || r.status === "REWARDED").length;
    return {
      totalGyms: gyms.length,
      totalChallengeParticipations: participants.length,
      totalRedemptions: redemptions.length,
      totalReferrals: referrals.length,
      referralConversionRate: referrals.length ? Number(((convertedReferrals / referrals.length) * 100).toFixed(2)) : 0,
      totalPoints: xpAgg._sum.xp ?? 0,
      avgLevel: Number((xpAgg._avg.level ?? 1).toFixed(1)),
      topGyms: perGym.slice(0, 10),
    };
  }

  /** Gym engagement analytics: participation / redemption / referral rates. */
  static async analytics(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const gymId = user.gymId;
    const [totalMembers, challengeParticipants, redemptions, referrals, xpAgg, pointsAgg] = await Promise.all([
      prisma.member.count({ where: { gymId } }),
      prisma.challengeParticipant.count({ where: { challenge: { gymId } } }),
      prisma.rewardRedemption.count({ where: { gymId } }),
      prisma.referral.findMany({ where: { gymId }, select: { status: true } }),
      prisma.memberXP.aggregate({ where: { gymId }, _avg: { xp: true, level: true } }),
      prisma.pointTransaction.aggregate({ where: { gymId, points: { gt: 0 } }, _sum: { points: true } }),
    ]);
    const distinctParticipants = await prisma.challengeParticipant.findMany({
      where: { challenge: { gymId } },
      select: { memberId: true },
      distinct: ["memberId"],
    });
    const convertedReferrals = referrals.filter((r) => r.status === "CONVERTED" || r.status === "REWARDED").length;
    return {
      totalMembers,
      challengeParticipations: challengeParticipants,
      challengeParticipationRate: totalMembers ? Number(((distinctParticipants.length / totalMembers) * 100).toFixed(2)) : 0,
      rewardRedemptions: redemptions,
      rewardRedemptionRate: totalMembers ? Number(((redemptions / totalMembers) * 100).toFixed(2)) : 0,
      totalReferrals: referrals.length,
      referralConversionRate: referrals.length ? Number(((convertedReferrals / referrals.length) * 100).toFixed(2)) : 0,
      avgXp: Number((xpAgg._avg.xp ?? 0).toFixed(0)),
      avgLevel: Number((xpAgg._avg.level ?? 1).toFixed(1)),
      totalPointsAwarded: pointsAgg._sum.points ?? 0,
    };
  }
}