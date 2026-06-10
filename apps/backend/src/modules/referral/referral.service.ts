import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import { GamificationEvents } from "../gamification/engagement-events.service";
import { POINT_RULES } from "../gamification/points.service";

type AuthUser = { id: string; role: string; gymId: string | null };

/** Deterministic, shareable referral code for a member. */
export function referralCodeFor(memberId: string) {
  return `REF-${memberId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()}`;
}

export class ReferralService {
  private static async resolveMember(user: AuthUser, memberId?: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    if (user.role === "MEMBER") {
      const m = await prisma.member.findFirst({ where: { userId: user.id, gymId: user.gymId } });
      if (!m) throw new AppError("Member profile not found", 404);
      return m;
    }
    if (!memberId) throw new AppError("memberId is required", 400);
    const m = await prisma.member.findFirst({ where: { id: memberId, gymId: user.gymId } });
    if (!m) throw new AppError("Member not found", 404);
    return m;
  }

  /** The caller's referral code, share text, and conversion stats. */
  static async getMyCode(user: AuthUser) {
    const member = await this.resolveMember(user);
    const code = referralCodeFor(member.id);
    const referrals = await prisma.referral.findMany({
      where: { gymId: user.gymId!, referrerId: member.id },
      select: { status: true },
    });
    const converted = referrals.filter((r) => r.status === "CONVERTED" || r.status === "REWARDED").length;
    return {
      code,
      shareText: `Join me at the gym! Use my referral code ${code} when you sign up.`,
      total: referrals.length,
      converted,
      rewardPerConversion: POINT_RULES.REFERRAL_CONVERTED,
    };
  }

  static async myReferrals(user: AuthUser) {
    const member = await this.resolveMember(user);
    return prisma.referral.findMany({
      where: { gymId: user.gymId!, referrerId: member.id },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Member invites someone; optionally creates a Stage 7 Lead (source REFERRAL). */
  static async createInvite(
    user: AuthUser,
    data: { inviteeName?: string; inviteePhone?: string; inviteeEmail?: string; memberId?: string },
  ) {
    const member = await this.resolveMember(user, data.memberId);
    const code = referralCodeFor(member.id);

    let referredLeadId: string | undefined;
    if (data.inviteePhone && data.inviteeName) {
      try {
        const referrerUser = await prisma.member.findUnique({
          where: { id: member.id },
          include: { user: true },
        });
        const lead = await prisma.lead.create({
          data: {
            gymId: user.gymId!,
            name: data.inviteeName,
            phone: data.inviteePhone,
            email: data.inviteeEmail,
            source: "REFERRAL",
            notes: `Referred by ${referrerUser?.user?.name ?? "a member"} (code ${code})`,
          },
        });
        referredLeadId = lead.id;
      } catch {
        // Lead creation is best-effort; the referral still records the invite.
      }
    }

    return prisma.referral.create({
      data: {
        gymId: user.gymId!,
        referrerId: member.id,
        code,
        inviteeName: data.inviteeName,
        inviteePhone: data.inviteePhone,
        inviteeEmail: data.inviteeEmail,
        referredLeadId,
        status: "PENDING",
      },
    });
  }

  /** Staff marks a referral converted → awards the referrer points (idempotent). */
  static async convert(user: AuthUser, referralId: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const referral = await prisma.referral.findFirst({ where: { id: referralId, gymId: user.gymId } });
    if (!referral) throw new AppError("Referral not found", 404);
    if (referral.status === "CONVERTED" || referral.status === "REWARDED") {
      throw new AppError("Referral already converted", 400);
    }

    const points = POINT_RULES.REFERRAL_CONVERTED;
    await GamificationEvents.referralConverted({
      gymId: user.gymId,
      memberId: referral.referrerId,
      referralId: referral.id,
      points,
    });

    return prisma.referral.update({
      where: { id: referral.id },
      data: { status: "REWARDED", rewardPoints: points, convertedAt: new Date() },
    });
  }

  static async listForGym(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const referrals = await prisma.referral.findMany({
      where: { gymId: user.gymId },
      include: { referrer: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    });
    const total = referrals.length;
    const converted = referrals.filter((r) => r.status === "CONVERTED" || r.status === "REWARDED").length;
    const rewardsIssued = referrals.reduce((s, r) => s + (r.rewardPoints ?? 0), 0);
    return {
      referrals,
      stats: {
        total,
        converted,
        pending: referrals.filter((r) => r.status === "PENDING").length,
        conversionRate: total ? Number(((converted / total) * 100).toFixed(2)) : 0,
        rewardsIssued,
      },
    };
  }
}
