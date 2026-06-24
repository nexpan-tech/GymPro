import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import type { CommChannel, DeliveryStatus } from "@prisma/client";

type AuthUser = { id: string; role: string; gymId: string | null };

export class CommsAnalyticsService {
  /** Sent / read / failed + per-channel breakdown + broadcast reach + chat response time. */
  static async overview(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const gymId = user.gymId;

    const [notifTotal, notifRead, deliveryLogs, announcements, receipts] = await Promise.all([
      prisma.notification.count({ where: { gymId } }),
      prisma.notification.count({ where: { gymId, isRead: true } }),
      prisma.deliveryLog.findMany({ where: { gymId }, select: { channel: true, status: true } }),
      prisma.announcement.count({ where: { gymId, status: "SENT" } }),
      prisma.announcementReceipt.findMany({
        where: { announcement: { gymId } },
        select: { readAt: true },
      }),
    ]);

    // Per-channel breakdown.
    const byChannel: Record<string, { sent: number; failed: number; skipped: number }> = {};
    let totalSent = 0;
    let totalFailed = 0;
    for (const log of deliveryLogs) {
      const ch = log.channel as CommChannel;
      byChannel[ch] = byChannel[ch] ?? { sent: 0, failed: 0, skipped: 0 };
      const st = log.status as DeliveryStatus;
      if (st === "FAILED") { byChannel[ch].failed += 1; totalFailed += 1; }
      else if (st === "SKIPPED") byChannel[ch].skipped += 1;
      else { byChannel[ch].sent += 1; totalSent += 1; }
    }

    const announcementReads = receipts.filter((r) => r.readAt != null).length;
    const chatResponse = await this.chatResponseTime(gymId);

    return {
      notifications: { total: notifTotal, read: notifRead, readRate: notifTotal ? Number(((notifRead / notifTotal) * 100).toFixed(1)) : 0 },
      delivery: { sent: totalSent, failed: totalFailed, total: deliveryLogs.length },
      channels: byChannel,
      announcements: { sent: announcements, recipients: receipts.length, reads: announcementReads, readRate: receipts.length ? Number(((announcementReads / receipts.length) * 100).toFixed(1)) : 0 },
      chat: chatResponse,
    };
  }

  /**
   * Recent delivery logs for the delivery-status table — de-duplicated on read.
   *
   * Each real delivery should appear once. A duplicate row is the SAME
   * channel + recipient + source (refType/refId) — or, when there's no source
   * ref, the same channel + recipient + title within the same minute. These
   * arise from worker retries, overlapping audiences, or legacy double-inserts.
   * We over-fetch, collapse keeping the most recent row, then return `limit`.
   * Read-only — no rows are deleted.
   */
  static async deliveryLogs(user: AuthUser, limit = 50) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const rows = await prisma.deliveryLog.findMany({
      where: { gymId: user.gymId },
      orderBy: { createdAt: "desc" },
      take: limit * 4,
    });

    const seen = new Set<string>();
    const deduped: typeof rows = [];
    for (const r of rows) {
      const recipient = r.userId ?? r.memberId ?? r.recipientAddr ?? "";
      const key = r.refId
        ? `${r.channel}|${recipient}|${r.refType ?? ""}|${r.refId}`
        : `${r.channel}|${recipient}|${r.title ?? ""}|${new Date(r.createdAt).toISOString().slice(0, 16)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(r);
      if (deduped.length >= limit) break;
    }
    return deduped;
  }

  /**
   * Average trainer response time (ms) across chat threads: time between a member
   * message and the next message from someone else (the trainer) in that thread.
   */
  private static async chatResponseTime(gymId: string) {
    const messages = await prisma.trainerMessage.findMany({
      // Trainer<->member threads only (skip admin<->trainer staff DMs, memberId null).
      where: { gymId, memberId: { not: null } },
      select: { memberId: true, senderId: true, member: { select: { userId: true } }, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 2000,
    });

    const deltas: number[] = [];
    const lastMemberMsgAt = new Map<string, number>(); // memberId → ts of last member-sent msg awaiting reply
    for (const m of messages) {
      if (!m.memberId) continue;
      const fromMember = m.senderId === m.member?.userId;
      if (fromMember) {
        if (!lastMemberMsgAt.has(m.memberId)) lastMemberMsgAt.set(m.memberId, m.createdAt.getTime());
      } else {
        const pending = lastMemberMsgAt.get(m.memberId);
        if (pending != null) {
          deltas.push(m.createdAt.getTime() - pending);
          lastMemberMsgAt.delete(m.memberId);
        }
      }
    }

    const avgMs = deltas.length ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length) : 0;
    return {
      avgResponseMs: avgMs,
      avgResponseMinutes: Number((avgMs / 60000).toFixed(1)),
      samples: deltas.length,
    };
  }
}
