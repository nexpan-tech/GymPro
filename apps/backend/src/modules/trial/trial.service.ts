import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import { MembershipService } from "../membership/membership.service";

type AuthUser = { id: string; role: string; gymId: string | null };

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

const trialInclude = {
  lead: true,
  member: { include: { user: true } },
} as const;

export class TrialService {
  static async create(
    user: AuthUser,
    data: {
      leadId?: string;
      memberId?: string;
      planId?: string;
      days?: number;
      endDate?: string;
      notes?: string;
    },
  ) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    if (!data.leadId && !data.memberId) {
      throw new AppError("A leadId or memberId is required for a trial", 400);
    }

    // Validate ownership of any referenced lead/member.
    if (data.leadId) {
      const lead = await prisma.lead.findFirst({ where: { id: data.leadId, gymId: user.gymId } });
      if (!lead) throw new AppError("Lead not found in this gym", 404);
    }
    if (data.memberId) {
      const member = await prisma.member.findFirst({ where: { id: data.memberId, gymId: user.gymId } });
      if (!member) throw new AppError("Member not found in this gym", 404);
    }

    const start = new Date();
    const endDate = data.endDate ? new Date(data.endDate) : addDays(start, data.days ?? 7);

    const trial = await prisma.trialMembership.create({
      data: {
        gymId: user.gymId,
        leadId: data.leadId,
        memberId: data.memberId,
        planId: data.planId,
        startDate: start,
        endDate,
        status: "ACTIVE",
        notes: data.notes,
      },
      include: trialInclude,
    });

    // Reflect the trial on the lead pipeline + activity log when applicable.
    if (data.leadId) {
      await prisma.lead.update({ where: { id: data.leadId }, data: { status: "TRIAL", trialDate: start } });
      await prisma.leadActivity.create({
        data: {
          gymId: user.gymId,
          leadId: data.leadId,
          type: "TRIAL_STARTED",
          note: `Trial started, ends ${endDate.toDateString()}`,
          toStatus: "TRIAL",
          createdById: user.id,
        },
      });
    }

    return trial;
  }

  static async list(user: AuthUser, status?: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    return prisma.trialMembership.findMany({
      where: { gymId: user.gymId, ...(status ? { status: status as never } : {}) },
      include: trialInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  static async getById(user: AuthUser, id: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const trial = await prisma.trialMembership.findFirst({
      where: { id, gymId: user.gymId },
      include: trialInclude,
    });
    if (!trial) throw new AppError("Trial not found", 404);
    return trial;
  }

  /**
   * Convert a trial to a paid membership. When the trial is attached to a member
   * and a planId is available, a real Membership is created via MembershipService
   * (no duplicate membership logic). The trial + originating lead are marked
   * CONVERTED with conversion timestamps for conversionRate analytics.
   */
  static async convert(user: AuthUser, id: string, data: { planId?: string; amount?: number }) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const trial = await this.getById(user, id);
    if (trial.status === "CONVERTED") throw new AppError("Trial already converted", 400);

    const now = new Date();
    let membership = null;

    const planId = data.planId ?? trial.planId ?? undefined;
    if (trial.memberId && planId) {
      membership = await MembershipService.create(user.gymId, {
        memberId: trial.memberId,
        planId,
        amount: data.amount,
        paymentStatus: "PENDING",
      } as never);
    }

    const updated = await prisma.trialMembership.update({
      where: { id: trial.id },
      data: {
        status: "CONVERTED",
        convertedAt: now,
        convertedMembershipId: membership?.id ?? null,
      },
      include: trialInclude,
    });

    if (trial.leadId) {
      await prisma.lead.update({
        where: { id: trial.leadId },
        data: { status: "CONVERTED", convertedAt: now },
      });
      await prisma.leadActivity.create({
        data: {
          gymId: user.gymId,
          leadId: trial.leadId,
          type: "CONVERSION",
          note: "Trial converted to paid membership",
          toStatus: "CONVERTED",
          createdById: user.id,
        },
      });
    }

    return { trial: updated, membership };
  }

  static async setStatus(user: AuthUser, id: string, status: "EXPIRED" | "CANCELLED") {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    await this.getById(user, id);
    return prisma.trialMembership.update({
      where: { id },
      data: { status },
      include: trialInclude,
    });
  }

  static async stats(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const trials = await prisma.trialMembership.findMany({
      where: { gymId: user.gymId },
      select: { status: true },
    });
    const total = trials.length;
    const converted = trials.filter((t) => t.status === "CONVERTED").length;
    const active = trials.filter((t) => t.status === "ACTIVE").length;
    const expired = trials.filter((t) => t.status === "EXPIRED").length;
    const cancelled = trials.filter((t) => t.status === "CANCELLED").length;
    return {
      total,
      active,
      converted,
      expired,
      cancelled,
      conversionRate: total ? Number(((converted / total) * 100).toFixed(2)) : 0,
    };
  }
}
