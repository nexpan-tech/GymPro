import { prisma } from "../../config/db";
import { notificationQueue } from "../../queues/notification.queue";
import { AppError } from "../../utils/response";
import { logger } from "../../config/logger";
import { buildMessage } from "./notification.utils";
import { emitToUser } from "../../realtime/socket";
import { SOCKET_EVENTS } from "../../realtime/socket-events";

export class NotificationService {
  /**
   * Create a notification.
   *
   * RESILIENT BY DESIGN (Stage-refinement fix): the in-app record + the realtime
   * socket emit ALWAYS succeed. The out-of-band channel fan-out (email/SMS/
   * WhatsApp/push) is enqueued best-effort — if Redis / the queue is unavailable
   * the request still succeeds and we report the channel as `Skipped`/`Failed`
   * instead of throwing. Returns the notification plus per-channel status.
   */
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
    let memberUserId: string | null = null;

    if (data.memberId) {
      const member = await prisma.member.findFirst({
        where: {
          id: data.memberId,
          gymId,
        },
        include: {
          user: { select: { id: true, name: true } },
        },
      });

      if (!member) {
        throw new AppError("Member not found", 404);
      }

      memberUserId = member.user?.id ?? null;
      finalMessage =
        data.message || buildMessage(data.type, member.user.name);
    }

    // 1) In-app record — must always succeed.
    const notification = await prisma.notification.create({
      data: {
        gymId,
        memberId: data.memberId,
        type: data.type,
        title: data.title,
        message: finalMessage!,
      },
    });

    // 2) Realtime socket push — best-effort, never blocks.
    const channels: Record<string, "Sent" | "Queued" | "Skipped" | "Failed"> = {
      inApp: "Sent",
      socket: "Skipped",
      outbound: "Skipped",
    };
    try {
      if (memberUserId) {
        emitToUser(memberUserId, SOCKET_EVENTS.NOTIFICATION_CREATED, {
          id: notification.id,
          type: data.type,
          title: data.title,
          message: finalMessage,
          createdAt: notification.createdAt,
        });
        channels.socket = "Sent";
      }
    } catch (err) {
      channels.socket = "Failed";
      logger.warn("Notification socket emit failed (non-fatal)", { id: notification.id });
    }

    // 3) Out-of-band channels — queued best-effort; queue/Redis outage never fails the request.
    try {
      await notificationQueue.add("send-notification", {
        notificationId: notification.id,
        gymId,
        memberId: data.memberId,
        type: data.type,
        title: data.title,
        message: finalMessage,
      });
      channels.outbound = "Queued";
    } catch (err) {
      channels.outbound = "Failed";
      logger.error("Notification queue enqueue failed (non-fatal) — in-app delivered", {
        id: notification.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return { ...notification, channels };
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