import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import { GamificationEvents } from "../gamification/engagement-events.service";
import { emitToGym } from "../../realtime/socket";
import { SOCKET_EVENTS } from "../../realtime/socket-events";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

export class CommunityService {
  static async createChallenge(user: AuthUser, data: any) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.challenge.create({
      data: {
        gymId: user.gymId,
        title: data.title,
        description: data.description,
        type: data.type,
        status: data.status || "UPCOMING",
        targetValue: data.targetValue,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });
  }

  static async getChallenges(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.challenge.findMany({
      where: { gymId: user.gymId },
      include: {
        participants: {
          include: {
            member: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async joinChallenge(user: AuthUser, challengeId: string, memberId: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const challenge = await prisma.challenge.findFirst({
      where: {
        id: challengeId,
        gymId: user.gymId,
      },
    });

    if (!challenge) throw new AppError("Challenge not found", 404);

    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        gymId: user.gymId,
      },
    });

    if (!member) throw new AppError("Member not found", 404);

    const participant = await prisma.challengeParticipant.upsert({
      where: {
        challengeId_memberId: {
          challengeId,
          memberId,
        },
      },
      update: {},
      create: {
        challengeId,
        memberId,
      },
      include: {
        challenge: true,
        member: {
          include: {
            user: true,
          },
        },
      },
    });

    // Stage 8 — join points (idempotent per member+challenge).
    await GamificationEvents.challengeJoined({ gymId: user.gymId, memberId, challengeId });

    return participant;
  }

  static async updateProgress(
    user: AuthUser,
    challengeId: string,
    memberId: string,
    progress: number
  ) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const participant = await prisma.challengeParticipant.findFirst({
      where: {
        challengeId,
        memberId,
        challenge: {
          gymId: user.gymId,
        },
      },
      include: {
        challenge: true,
      },
    });

    if (!participant) throw new AppError("Challenge participant not found", 404);

    const isCompleted =
      participant.challenge.targetValue !== null &&
      participant.challenge.targetValue !== undefined
        ? progress >= participant.challenge.targetValue
        : false;

    const updated = await prisma.challengeParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        progress,
        isCompleted,
      },
    });

    // Stage 8 — award completion points the first time the target is reached.
    if (isCompleted && !participant.isCompleted) {
      await GamificationEvents.challengeCompleted({
        gymId: user.gymId,
        memberId,
        challengeId,
        title: participant.challenge.title,
      });
    }

    // Stage 9 — realtime challenge update for live leaderboards.
    emitToGym(user.gymId, SOCKET_EVENTS.CHALLENGE_UPDATED, { challengeId, memberId, progress, isCompleted });

    return updated;
  }

  static async leaderboard(user: AuthUser, challengeId: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const challenge = await prisma.challenge.findFirst({
      where: {
        id: challengeId,
        gymId: user.gymId,
      },
    });

    if (!challenge) throw new AppError("Challenge not found", 404);

    const participants = await prisma.challengeParticipant.findMany({
      where: {
        challengeId,
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        progress: "desc",
      },
    });

    return participants.map((participant, index) => ({
      rank: index + 1,
      memberId: participant.memberId,
      name: participant.member.user.name,
      email: participant.member.user.email,
      progress: participant.progress,
      isCompleted: participant.isCompleted,
      joinedAt: participant.joinedAt,
    }));
  }

  static async globalLeaderboard(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const xps = await prisma.memberXP.findMany({
      where: {
        gymId: user.gymId,
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
      orderBy: [{ level: "desc" }, { xp: "desc" }],
    });

    return xps.map((xp, index) => ({
      rank: index + 1,
      memberId: xp.memberId,
      name: xp.member.user.name,
      email: xp.member.user.email,
      xp: xp.xp,
      level: xp.level,
      streak: xp.streak,
    }));
  }

  static async createGroup(user: AuthUser, data: any) {
  if (!user.gymId) throw new AppError("Gym context missing", 403);

  return prisma.communityGroup.create({
    data: {
      gymId: user.gymId,
      name: data.name,
      description: data.description,
      type: data.type,
      isPrivate: data.isPrivate || false,
    },
  });
}

static async getGroups(user: AuthUser) {
  if (!user.gymId) throw new AppError("Gym context missing", 403);

  return prisma.communityGroup.findMany({
    where: { gymId: user.gymId },
    include: {
      members: {
        include: {
          member: {
            include: {
              user: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

static async joinGroup(user: AuthUser, groupId: string, memberId: string) {
  if (!user.gymId) throw new AppError("Gym context missing", 403);

  const group = await prisma.communityGroup.findFirst({
    where: {
      id: groupId,
      gymId: user.gymId,
    },
  });

  if (!group) throw new AppError("Community group not found", 404);

  const member = await prisma.member.findFirst({
    where: {
      id: memberId,
      gymId: user.gymId,
    },
  });

  if (!member) throw new AppError("Member not found", 404);

  return prisma.communityGroupMember.upsert({
    where: {
      groupId_memberId: {
        groupId,
        memberId,
      },
    },
    update: {},
    create: {
      groupId,
      memberId,
    },
    include: {
      group: true,
      member: {
        include: {
          user: true,
        },
      },
    },
  });
}
}