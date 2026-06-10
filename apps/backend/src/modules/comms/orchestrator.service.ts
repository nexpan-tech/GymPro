import { prisma } from "../../config/db";
import { logger } from "../../config/logger";
import type { CommChannel, DeliveryStatus, NotificationType } from "@prisma/client";
import { isChannelAvailable } from "./channels";
import { getTokensForUser, sendPushNotification } from "../push/push.service";
import { sendEmail } from "../email/email.service";
import { sendSms } from "../sms/sms.service";
import { sendWhatsApp } from "../whatsapp/whatsapp.service";
import { emitToUser } from "../../realtime/socket";
import { SOCKET_EVENTS } from "../../realtime/socket-events";

/**
 * Stage 9 — multi-channel communication orchestrator.
 *
 * WRAPS (does not replace) the existing notification/push/email/sms/whatsapp/
 * socket systems. For each recipient × requested channel it attempts delivery,
 * gates unavailable channels (→ SKIPPED, never crash), and writes a DeliveryLog
 * row. IN_APP creates a Notification record directly (no legacy queue fan-out)
 * so channel selection stays explicit.
 */

export interface Recipient {
  userId: string;
  memberId?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface DispatchInput {
  gymId: string;
  channels: CommChannel[];
  recipients: Recipient[];
  title: string;
  message: string;
  type?: NotificationType;
  data?: Record<string, unknown>;
  refType?: string;
  refId?: string;
}

export interface DispatchResult {
  sent: number;
  skipped: number;
  failed: number;
  total: number;
}

async function logDelivery(input: {
  gymId: string;
  channel: CommChannel;
  status: DeliveryStatus;
  userId?: string | null;
  memberId?: string | null;
  recipientAddr?: string | null;
  provider?: string;
  title?: string;
  error?: string;
  refType?: string;
  refId?: string;
}) {
  try {
    await prisma.deliveryLog.create({
      data: {
        gymId: input.gymId,
        channel: input.channel,
        status: input.status,
        userId: input.userId ?? null,
        memberId: input.memberId ?? null,
        recipientAddr: input.recipientAddr ?? null,
        provider: input.provider,
        title: input.title,
        error: input.error,
        refType: input.refType,
        refId: input.refId,
        sentAt: input.status === "SENT" || input.status === "DELIVERED" ? new Date() : null,
      },
    });
  } catch (err) {
    logger.error("DeliveryLog write failed", err);
  }
}

export class CommunicationOrchestrator {
  /** Fan a message out across channels to a set of recipients. Best-effort per channel. */
  static async dispatch(input: DispatchInput): Promise<DispatchResult> {
    const result: DispatchResult = { sent: 0, skipped: 0, failed: 0, total: 0 };
    const channels = Array.from(new Set(input.channels));

    for (const recipient of input.recipients) {
      for (const channel of channels) {
        result.total += 1;
        const base = {
          gymId: input.gymId,
          channel,
          userId: recipient.userId,
          memberId: recipient.memberId ?? null,
          title: input.title,
          refType: input.refType,
          refId: input.refId,
        };

        // Gate unavailable channels up front.
        if (!isChannelAvailable(channel)) {
          await logDelivery({ ...base, status: "SKIPPED", error: "channel not configured" });
          result.skipped += 1;
          continue;
        }

        try {
          const status = await this.deliverOne(channel, recipient, input);
          await logDelivery({ ...base, status, recipientAddr: this.addrFor(channel, recipient) });
          if (status === "SKIPPED") result.skipped += 1;
          else result.sent += 1;
        } catch (err) {
          await logDelivery({ ...base, status: "FAILED", error: err instanceof Error ? err.message : String(err) });
          result.failed += 1;
        }
      }
    }
    return result;
  }

  private static addrFor(channel: CommChannel, r: Recipient): string | null {
    if (channel === "EMAIL") return r.email ?? null;
    if (channel === "SMS" || channel === "WHATSAPP") return r.phone ?? null;
    return null;
  }

  private static async deliverOne(
    channel: CommChannel,
    recipient: Recipient,
    input: DispatchInput,
  ): Promise<DeliveryStatus> {
    switch (channel) {
      case "IN_APP": {
        if (!recipient.memberId) return "SKIPPED"; // in-app notifications are member-scoped
        await prisma.notification.create({
          data: {
            gymId: input.gymId,
            memberId: recipient.memberId,
            type: input.type ?? "GENERAL",
            title: input.title,
            message: input.message,
            isSent: true,
            sentAt: new Date(),
          },
        });
        // Also push to the live socket so open clients update immediately.
        emitToUser(recipient.userId, SOCKET_EVENTS.NOTIFICATION_CREATED, {
          title: input.title,
          message: input.message,
          type: input.type ?? "GENERAL",
        });
        return "SENT";
      }
      case "SOCKET": {
        emitToUser(recipient.userId, SOCKET_EVENTS.NOTIFICATION_CREATED, {
          title: input.title,
          message: input.message,
          data: input.data ?? {},
        });
        return "SENT";
      }
      case "PUSH": {
        const tokens = await getTokensForUser(recipient.userId);
        if (tokens.length === 0) return "SKIPPED";
        await sendPushNotification({ tokens, title: input.title, body: input.message, data: input.data });
        return "SENT";
      }
      case "EMAIL": {
        if (!recipient.email) return "SKIPPED";
        const res = (await sendEmail({
          to: recipient.email,
          subject: input.title,
          html: `<div style="font-family:Arial,sans-serif"><h3>${input.title}</h3><p>${input.message}</p></div>`,
        })) as { skipped?: boolean };
        return res?.skipped ? "SKIPPED" : "SENT";
      }
      case "SMS": {
        if (!recipient.phone) return "SKIPPED";
        const res = (await sendSms({ phone: recipient.phone, message: `${input.title}: ${input.message}` })) as { skipped?: boolean };
        return res?.skipped ? "SKIPPED" : "SENT";
      }
      case "WHATSAPP": {
        if (!recipient.phone) return "SKIPPED";
        const res = (await sendWhatsApp({ phone: recipient.phone, message: `${input.title}: ${input.message}` })) as { skipped?: boolean };
        return res?.skipped ? "SKIPPED" : "SENT";
      }
      default:
        return "SKIPPED";
    }
  }

  /**
   * Resolve a gym audience to recipients (userId + member/email/phone).
   * Tenant-scoped: only ever returns users/members of `gymId`.
   */
  static async resolveAudience(
    gymId: string,
    audience: "ALL" | "MEMBERS" | "TRAINERS" | "STAFF" | "BRANCH" | "CUSTOM",
    opts: { branchId?: string | null; memberIds?: string[] } = {},
  ): Promise<Recipient[]> {
    const recipients: Recipient[] = [];

    const wantsMembers = audience === "ALL" || audience === "MEMBERS" || audience === "BRANCH" || audience === "CUSTOM";
    const wantsStaff = audience === "ALL" || audience === "STAFF" || audience === "TRAINERS";

    if (wantsMembers) {
      const memberWhere: Record<string, unknown> = { gymId };
      if (audience === "BRANCH" && opts.branchId) memberWhere.branchId = opts.branchId;
      if (audience === "CUSTOM" && opts.memberIds?.length) memberWhere.id = { in: opts.memberIds };
      const members = await prisma.member.findMany({ where: memberWhere, include: { user: true } });
      for (const m of members) {
        recipients.push({ userId: m.userId, memberId: m.id, email: m.user?.email, phone: m.phone });
      }
    }

    if (wantsStaff) {
      const roles =
        audience === "TRAINERS" ? ["TRAINER"] : ["ADMIN", "RECEPTIONIST", "TRAINER"];
      const staff = await prisma.user.findMany({ where: { gymId, role: { in: roles as never } } });
      for (const u of staff) recipients.push({ userId: u.id, email: u.email, phone: null });
    }

    // De-dup by userId.
    const seen = new Set<string>();
    return recipients.filter((r) => (seen.has(r.userId) ? false : (seen.add(r.userId), true)));
  }
}
