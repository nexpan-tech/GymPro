import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

type BadgeType = "ATTENDANCE" | "STREAK" | "GOAL" | "PROGRESS" | "SPECIAL";

export class BadgeService {
  private static async getMemberForAccess(user: AuthUser, memberId: string) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    const member = await prisma.member.findFirst({
      where: { id: memberId, gymId: user.gymId },
    });

    if (!member) {
      throw new AppError("Member not found in this gym", 404);
    }

    if (user.role === "MEMBER" && member.userId !== user.id) {
      throw new AppError("You can only access your own badges", 403);
    }

    if (user.role === "TRAINER" && member.trainerId !== user.id) {
      throw new AppError("You can only access assigned member badges", 403);
    }

    return member;
  }

  static async createBadge(data: {
    name: string;
    description?: string;
    type: BadgeType;
    icon?: string;
  }) {
    return prisma.badge.create({
      data,
    });
  }

  static async getBadges() {
    return prisma.badge.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  static async awardBadge(user: AuthUser, memberId: string, badgeId: string) {
    await this.getMemberForAccess(user, memberId);

    const badge = await prisma.badge.findUnique({
      where: { id: badgeId },
    });

    if (!badge) {
      throw new AppError("Badge not found", 404);
    }

    return prisma.memberBadge.upsert({
      where: {
        memberId_badgeId: {
          memberId,
          badgeId,
        },
      },
      update: {},
      create: {
        gymId: user.gymId!,
        memberId,
        badgeId,
      },
      include: {
        badge: true,
        member: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  static async getMemberBadges(user: AuthUser, memberId: string) {
    await this.getMemberForAccess(user, memberId);

    return prisma.memberBadge.findMany({
      where: {
        gymId: user.gymId!,
        memberId,
      },
      include: {
        badge: true,
      },
      orderBy: {
        earnedAt: "desc",
      },
    });
  }

  static async getMyBadges(user: AuthUser) {
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

    return this.getMemberBadges(user, member.id);
  }

  static async autoAwardGoalBadge(user: AuthUser, memberId: string) {
    await this.getMemberForAccess(user, memberId);

    let badge = await prisma.badge.findFirst({
      where: {
        name: "Goal Crusher",
        type: "GOAL",
      },
    });

    if (!badge) {
      badge = await prisma.badge.create({
        data: {
          name: "Goal Crusher",
          description: "Completed a fitness goal",
          type: "GOAL",
          icon: "🏆",
        },
      });
    }

    return this.awardBadge(user, memberId, badge.id);
  }

  static async autoAwardAttendanceBadge(user: AuthUser, memberId: string) {
    await this.getMemberForAccess(user, memberId);

    const attendanceCount = await prisma.attendance.count({
      where: {
        gymId: user.gymId!,
        memberId,
      },
    });

    if (attendanceCount < 10) {
      return null;
    }

    let badge = await prisma.badge.findFirst({
      where: {
        name: "10 Check-ins",
        type: "ATTENDANCE",
      },
    });

    if (!badge) {
      badge = await prisma.badge.create({
        data: {
          name: "10 Check-ins",
          description: "Completed 10 gym check-ins",
          type: "ATTENDANCE",
          icon: "🔥",
        },
      });
    }

    return this.awardBadge(user, memberId, badge.id);
  }
}