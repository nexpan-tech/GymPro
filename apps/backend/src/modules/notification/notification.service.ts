import { prisma } from "../../config/db";
import { notificationQueue } from "../../queues/notification.queue";
import { AppError } from "../../utils/response";
import { buildMessage } from "./notification.utils";

export class NotificationService {
  static async create(
    gymId: string,
    data: {
      memberId?: string;
      type: any;
      title: string;
      message?: string;
    }
  ) {
    let finalMessage = data.message;

    if (data.memberId) {
      const member = await prisma.member.findFirst({
        where: {
          id: data.memberId,
          gymId,
        },
        include: {
          user: true,
        },
      });

      if (!member) {
        throw new AppError("Member not found", 404);
      }

      finalMessage =
        data.message || buildMessage(data.type, member.user.name);
    }

    const notification = await prisma.notification.create({
      data: {
        gymId,
        memberId: data.memberId,
        type: data.type,
        title: data.title,
        message: finalMessage!,
      },
    });

    await notificationQueue.add("send-notification", {
      notificationId: notification.id,
      gymId,
      memberId: data.memberId,
      type: data.type,
      title: data.title,
      message: finalMessage,
    });

    return notification;
  }

  static async getAll(gymId: string) {
    return prisma.notification.findMany({
      where: {
        gymId,
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

  static async getByMember(gymId: string, memberId: string) {
    return prisma.notification.findMany({
      where: {
        gymId,
        memberId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async markAsSent(id: string) {
    return prisma.notification.update({
      where: {
        id,
      },
      data: {
        isSent: true,
        sentAt: new Date(),
      },
    });
  }

  // ── Stage 9 — member self-service + read receipts ──────────────────────────

  private static async resolveMember(userId: string, gymId: string) {
    const member = await prisma.member.findFirst({ where: { userId, gymId } });
    if (!member) throw new AppError("Member profile not found", 404);
    return member;
  }

  /** The caller's own notifications (member self-list) with unread count. */
  static async listMine(userId: string, gymId: string, opts: { unreadOnly?: boolean } = {}) {
    const member = await this.resolveMember(userId, gymId);
    const where: Record<string, unknown> = { gymId, memberId: member.id };
    if (opts.unreadOnly) where.isRead = false;
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.notification.count({ where: { gymId, memberId: member.id, isRead: false } }),
    ]);
    return { items, unreadCount };
  }

  /** Mark one of the caller's notifications read (ownership-checked). */
  static async markRead(userId: string, gymId: string, id: string) {
    const member = await this.resolveMember(userId, gymId);
    const notif = await prisma.notification.findFirst({ where: { id, gymId, memberId: member.id } });
    if (!notif) throw new AppError("Notification not found", 404);
    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /** Mark all the caller's notifications read. */
  static async markAllRead(userId: string, gymId: string) {
    const member = await this.resolveMember(userId, gymId);
    const res = await prisma.notification.updateMany({
      where: { gymId, memberId: member.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { updated: res.count };
  }
}