import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import type { CommChannel } from "@prisma/client";
import { CommunicationOrchestrator } from "../comms/orchestrator.service";
import { emitAnnouncement } from "../../realtime/socket";

type AuthUser = { id: string; role: string; gymId: string | null };

const include = {
  branch: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  _count: { select: { receipts: true } },
} as const;

export class AnnouncementService {
  static async create(user: AuthUser, data: any) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const status = data.scheduledAt ? "SCHEDULED" : data.status ?? "DRAFT";
    return prisma.announcement.create({
      data: {
        gymId: user.gymId,
        createdById: user.id,
        title: data.title,
        message: data.message,
        audience: data.audience ?? "ALL",
        branchId: data.audience === "BRANCH" ? data.branchId ?? null : null,
        memberIds: data.audience === "CUSTOM" && Array.isArray(data.memberIds) ? data.memberIds : [],
        priority: data.priority ?? "NORMAL",
        channels: Array.isArray(data.channels) ? (data.channels as CommChannel[]) : [],
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        status,
      },
      include,
    });
  }

  static async list(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    return prisma.announcement.findMany({
      where: { gymId: user.gymId },
      include,
      orderBy: { createdAt: "desc" },
    });
  }

  static async getById(user: AuthUser, id: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const a = await prisma.announcement.findFirst({ where: { id, gymId: user.gymId }, include });
    if (!a) throw new AppError("Announcement not found", 404);
    return a;
  }

  static async update(user: AuthUser, id: string, data: any) {
    const existing = await this.getById(user, id);
    if (existing.status === "SENT") throw new AppError("A sent announcement cannot be edited", 400);
    return prisma.announcement.update({
      where: { id },
      data: {
        title: data.title,
        message: data.message,
        audience: data.audience,
        branchId: data.audience === "BRANCH" ? data.branchId ?? null : data.branchId,
        memberIds: data.memberIds,
        priority: data.priority,
        channels: data.channels,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : data.scheduledAt === null ? null : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : data.expiresAt === null ? null : undefined,
      },
      include,
    });
  }

  static async cancel(user: AuthUser, id: string) {
    const existing = await this.getById(user, id);
    if (existing.status === "SENT") throw new AppError("A sent announcement cannot be cancelled", 400);
    return prisma.announcement.update({ where: { id }, data: { status: "CANCELLED" }, include });
  }

  /**
   * Send an announcement now: resolve audience → create read receipts →
   * fan out via the orchestrator (IN_APP + SOCKET + configured channels) →
   * mark SENT and emit `announcement.sent`.
   */
  static async send(user: AuthUser, id: string) {
    const announcement = await this.getById(user, id);
    if (announcement.status === "SENT") throw new AppError("Announcement already sent", 400);
    if (announcement.status === "CANCELLED") throw new AppError("Cancelled announcement cannot be sent", 400);

    const recipients = await CommunicationOrchestrator.resolveAudience(
      user.gymId!,
      announcement.audience,
      { branchId: announcement.branchId, memberIds: announcement.memberIds },
    );

    // Read receipts (deduped by @@unique).
    if (recipients.length > 0) {
      await prisma.announcementReceipt.createMany({
        data: recipients.map((r) => ({ announcementId: announcement.id, userId: r.userId })),
        skipDuplicates: true,
      });
    }

    // Channels: always IN_APP (members) + SOCKET (everyone), plus any configured extras.
    const channels = Array.from(new Set<CommChannel>(["IN_APP", "SOCKET", ...announcement.channels]));
    const delivery = await CommunicationOrchestrator.dispatch({
      gymId: user.gymId!,
      channels,
      recipients,
      title: announcement.title,
      message: announcement.message,
      refType: "announcement",
      refId: announcement.id,
    });

    const updated = await prisma.announcement.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date() },
      include,
    });

    emitAnnouncement(user.gymId!, {
      id: announcement.id,
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority,
    });

    return { announcement: updated, recipients: recipients.length, delivery };
  }

  // ── Member-facing ──────────────────────────────────────────────────────────

  /** Announcements targeted at the caller, via their receipts, with unread count. */
  static async listMine(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const now = new Date();
    const receipts = await prisma.announcementReceipt.findMany({
      where: {
        userId: user.id,
        announcement: { gymId: user.gymId, status: "SENT", OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      },
      include: { announcement: { include: { createdBy: { select: { name: true } } } } },
      orderBy: { deliveredAt: "desc" },
    });
    const items = receipts.map((r) => ({
      id: r.announcement.id,
      title: r.announcement.title,
      message: r.announcement.message,
      priority: r.announcement.priority,
      sentAt: r.announcement.sentAt,
      isRead: r.readAt != null,
      readAt: r.readAt,
      receiptId: r.id,
    }));
    return { items, unreadCount: items.filter((i) => !i.isRead).length };
  }

  static async markRead(user: AuthUser, announcementId: string) {
    const receipt = await prisma.announcementReceipt.findFirst({
      where: { announcementId, userId: user.id },
    });
    if (!receipt) throw new AppError("Announcement not found for you", 404);
    if (receipt.readAt) return receipt;
    return prisma.announcementReceipt.update({ where: { id: receipt.id }, data: { readAt: new Date() } });
  }
}
