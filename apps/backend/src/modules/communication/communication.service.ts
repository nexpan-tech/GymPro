import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import { emitChatMessage, emitToUser, emitToStaff } from "../../realtime/socket";
import { SOCKET_EVENTS } from "../../realtime/socket-events";

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

    const created = await prisma.trainerMessage.create({
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

    // Stage 9 — realtime delivery to both participants (trainer + member user).
    // Refinement: also push to the gym staff room so the admin chat console
    // updates live for admin<->member conversations.
    const payload = {
      id: created.id,
      gymId: created.gymId,
      memberId: created.memberId,
      trainerId: created.trainerId,
      senderId: created.senderId,
      type: created.type,
      message: created.message,
      createdAt: created.createdAt,
    };
    const recipientUserIds = [trainerId, member.userId].filter(Boolean) as string[];
    emitChatMessage(recipientUserIds, payload);
    emitToStaff(user.gymId!, SOCKET_EVENTS.CHAT_MESSAGE, payload);

    return created;
  }

  // ── Admin <-> Trainer staff DM (same table, memberId = null) ───────────────

  private static async getTrainerForStaffDm(user: AuthUser, trainerId: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const trainer = await prisma.user.findFirst({
      where: { id: trainerId, gymId: user.gymId, role: "TRAINER" },
      select: { id: true, name: true },
    });
    if (!trainer) throw new AppError("Trainer not found in this gym", 404);
    // A trainer may only access their own staff thread; staff can access any.
    if (user.role === "TRAINER" && user.id !== trainerId) {
      throw new AppError("You can only access your own messages", 403);
    }
    return trainer;
  }

  /** Send an admin<->trainer message (memberId null). */
  static async sendStaffMessage(user: AuthUser, data: { trainerId: string; message: string }) {
    if (!data.message?.trim()) throw new AppError("Message is required", 400);
    const trainer = await this.getTrainerForStaffDm(user, data.trainerId);

    const created = await prisma.trainerMessage.create({
      data: {
        gymId: user.gymId!,
        trainerId: trainer.id,
        memberId: null,
        senderId: user.id,
        type: "TEXT",
        message: data.message,
      },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });

    const payload = {
      id: created.id,
      gymId: created.gymId,
      trainerId: created.trainerId,
      memberId: null,
      senderId: created.senderId,
      message: created.message,
      createdAt: created.createdAt,
      staff: true,
    };
    emitToUser(trainer.id, SOCKET_EVENTS.CHAT_MESSAGE, payload);
    emitToStaff(user.gymId!, SOCKET_EVENTS.CHAT_MESSAGE, payload);
    return created;
  }

  /** Read an admin<->trainer staff thread (auto-marks the other party read). */
  static async getStaffThread(user: AuthUser, trainerId: string) {
    const trainer = await this.getTrainerForStaffDm(user, trainerId);
    const messages = await prisma.trainerMessage.findMany({
      where: { gymId: user.gymId!, trainerId: trainer.id, memberId: null },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });
    await prisma.trainerMessage.updateMany({
      where: { gymId: user.gymId!, trainerId: trainer.id, memberId: null, senderId: { not: user.id }, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { trainerId: trainer.id, name: trainer.name, messages };
  }

  // ── Stage 9 — read receipts + thread helpers ──────────────────────────────

  /** Mark the OTHER party's messages in this thread as read by the caller. */
  static async markThreadRead(user: AuthUser, memberId: string) {
    const member = await this.getMemberAccess(user, memberId);
    const res = await prisma.trainerMessage.updateMany({
      where: {
        gymId: user.gymId!,
        memberId: member.id,
        senderId: { not: user.id },
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });
    // Notify the other party their messages were read.
    const otherUserId = user.id === member.userId ? member.trainerId : member.userId;
    if (otherUserId) emitToUser(otherUserId, SOCKET_EVENTS.CHAT_READ, { memberId: member.id, by: user.id });
    return { updated: res.count };
  }

  /** Member self thread: their conversation with their assigned trainer (auto-marks read). */
  static async getMyThread(user: AuthUser) {
    if (user.role !== "MEMBER") throw new AppError("Member-only route", 403);
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const member = await prisma.member.findFirst({ where: { userId: user.id, gymId: user.gymId } });
    if (!member) throw new AppError("Member profile not found", 404);

    const messages = await prisma.trainerMessage.findMany({
      where: { gymId: user.gymId, memberId: member.id },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });
    await prisma.trainerMessage.updateMany({
      where: { gymId: user.gymId, memberId: member.id, senderId: { not: user.id }, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { memberId: member.id, trainerId: member.trainerId, messages };
  }

  /** Trainer/admin thread list: assigned members with last message + unread count. */
  static async getThreads(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const memberWhere: Record<string, unknown> = { gymId: user.gymId };
    if (user.role === "TRAINER") memberWhere.trainerId = user.id;
    const members = await prisma.member.findMany({
      where: memberWhere,
      include: { user: { select: { id: true, name: true } } },
    });

    const threads = await Promise.all(
      members.map(async (m) => {
        const [last, unread] = await Promise.all([
          prisma.trainerMessage.findFirst({
            where: { gymId: user.gymId!, memberId: m.id },
            orderBy: { createdAt: "desc" },
          }),
          prisma.trainerMessage.count({
            where: { gymId: user.gymId!, memberId: m.id, senderId: { not: user.id }, isRead: false },
          }),
        ]);
        return {
          memberId: m.id,
          name: m.user?.name ?? "Member",
          lastMessage: last?.message ?? null,
          lastAt: last?.createdAt ?? null,
          unread,
        };
      }),
    );
    // Only surface members that have a conversation, newest first.
    return threads
      .filter((t) => t.lastAt != null)
      .sort((a, b) => new Date(b.lastAt!).getTime() - new Date(a.lastAt!).getTime());
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
