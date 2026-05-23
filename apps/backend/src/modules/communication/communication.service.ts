import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

export class CommunicationService {
  private static async getMemberAccess(user: AuthUser, memberId: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        gymId: user.gymId,
      },
      include: {
        trainer: true,
        user: true,
      },
    });

    if (!member) throw new AppError("Member not found", 404);

    if (user.role === "TRAINER" && member.trainerId !== user.id) {
      throw new AppError("You can only access assigned members", 403);
    }

    if (user.role === "MEMBER" && member.userId !== user.id) {
      throw new AppError("You can only access your own messages", 403);
    }

    return member;
  }

  static async sendMessage(user: AuthUser, data: any) {
    const member = await this.getMemberAccess(user, data.memberId);

    const trainerId =
      data.trainerId || member.trainerId || user.id;

    if (!trainerId) {
      throw new AppError("Trainer is required for messaging", 400);
    }

    if (!data.message) {
      throw new AppError("Message is required", 400);
    }

    return prisma.trainerMessage.create({
      data: {
        gymId: user.gymId!,
        trainerId,
        memberId: member.id,
        senderId: user.id,
        type: data.type || "TEXT",
        message: data.message,
      },
      include: {
        trainer: true,
        member: {
          include: {
            user: true,
          },
        },
        sender: true,
      },
    });
  }

  static async getMemberMessages(user: AuthUser, memberId: string) {
    const member = await this.getMemberAccess(user, memberId);

    return prisma.trainerMessage.findMany({
      where: {
        gymId: user.gymId!,
        memberId: member.id,
      },
      include: {
        trainer: true,
        sender: true,
        member: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  static async addProgressComment(user: AuthUser, data: any) {
    return this.sendMessage(user, {
      memberId: data.memberId,
      type: "PROGRESS_COMMENT",
      message: data.message,
    });
  }

  static async submitFeedback(user: AuthUser, data: any) {
    const member = await this.getMemberAccess(user, data.memberId);

    const trainerId = data.trainerId || member.trainerId;

    if (!trainerId) {
      throw new AppError("Trainer is required for feedback", 400);
    }

    if (!data.rating) {
      throw new AppError("Rating is required", 400);
    }

    return prisma.trainerFeedback.create({
      data: {
        gymId: user.gymId!,
        trainerId,
        memberId: member.id,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        trainer: true,
        member: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  static async getTrainerFeedback(user: AuthUser, trainerId: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    if (user.role === "TRAINER" && trainerId !== user.id) {
      throw new AppError("You can only view your own feedback", 403);
    }

    return prisma.trainerFeedback.findMany({
      where: {
        gymId: user.gymId,
        trainerId,
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}