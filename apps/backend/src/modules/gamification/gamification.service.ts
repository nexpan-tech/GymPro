import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

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
        xpCost: data.xpCost,
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
}