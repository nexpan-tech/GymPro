import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import { GamificationEvents } from "../gamification/engagement-events.service";
import { POINT_RULES } from "../gamification/points.service";
import { NotificationService } from "../notification/notification.service";
import { logger } from "../../config/logger";

type AuthUser = { id: string; role: string; gymId: string | null };

/** Deterministic, shareable referral code for a member. Permanent + unique. */
export function referralCodeFor(memberId: string) {
  return `REF-${memberId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()}`;
}

/** Reverse-resolve a referral code to its owning member, scoped to one gym. */
export async function findMemberByReferralCode(gymId: string, rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  const suffix = code.replace(/^REF-/, "").toLowerCase();
  if (!suffix) return null;
  // The code is the last-6 of the member id, so narrow by id suffix first.
  const candidates = await prisma.member.findFirst({
    where: { gymId, id: { endsWith: suffix } },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (candidates && referralCodeFor(candidates.id) === code) return candidates;
  return null;
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

  // ── Passive registration capture + anti-fraud ─────────────────────────────

  /**
   * Validate a referral code supplied during member registration. Enforces the
   * anti-fraud rules and returns the referring member (with user). Throws 400 on
   * any violation so registration fails cleanly BEFORE the member is created.
   *   • code must resolve to a member in the SAME gym (cross-gym blocked)
   *   • cannot refer yourself (referrer email === new member email)
   *   • the new member cannot already have been referred (duplicate blocked)
   */
  static async resolveReferrerForRegistration(gymId: string, rawCode: string, newMemberEmail: string) {
    const referrer = await findMemberByReferralCode(gymId, rawCode);
    if (!referrer) throw new AppError("Invalid referral code for this gym.", 400, { code: "REFERRAL_INVALID" });

    if (referrer.user?.email && referrer.user.email.toLowerCase() === newMemberEmail.toLowerCase()) {
      throw new AppError("You cannot refer yourself.", 400, { code: "REFERRAL_SELF" });
    }

    const existing = await prisma.referral.findFirst({
      where: { gymId, inviteeEmail: { equals: newMemberEmail, mode: "insensitive" } },
      select: { id: true },
    });
    if (existing) throw new AppError("This person has already been referred.", 400, { code: "REFERRAL_DUPLICATE" });

    return referrer;
  }

  /**
   * Record a PENDING referral after the referred member is created. The link to
   * the new member is the invitee email (matched again on membership activation).
   * Registration alone NEVER completes a referral — it stays PENDING until the
   * referred member activates their first membership. Best-effort + idempotent.
   */
  static async recordPendingReferral(
    gymId: string,
    referrer: { id: string; user?: { name?: string | null } | null },
    newMember: { id: string; name: string; email: string; phone?: string | null },
  ) {
    const code = referralCodeFor(referrer.id);
    const referral = await prisma.referral.create({
      data: {
        gymId,
        referrerId: referrer.id,
        code,
        inviteeName: newMember.name,
        inviteeEmail: newMember.email,
        inviteePhone: newMember.phone ?? null,
        status: "PENDING",
      },
    });

    // Notify the referrer that someone registered with their code (still pending).
    await NotificationService.create(gymId, {
      memberId: referrer.id,
      type: "GENERAL",
      title: "New referral registered 🎉",
      message: `${newMember.name} joined using your referral code. You'll earn your reward once they activate their first membership.`,
    }).catch(() => undefined);

    return referral;
  }

  /**
   * THE mandatory business rule: a referral becomes Successful only when the
   * referred member activates their FIRST membership. Called from
   * MembershipService.create for a member's first membership. Idempotent — a
   * referral already converted is skipped.
   */
  static async onFirstMembershipActivated(gymId: string, memberId: string) {
    const member = await prisma.member.findFirst({
      where: { id: memberId, gymId },
      include: { user: { select: { email: true, name: true } } },
    });
    const email = member?.user?.email;
    if (!email) return null;

    const referral = await prisma.referral.findFirst({
      where: { gymId, inviteeEmail: { equals: email, mode: "insensitive" }, status: "PENDING" },
    });
    if (!referral) return null;

    const points = POINT_RULES.REFERRAL_CONVERTED;
    const updated = await prisma.referral.update({
      where: { id: referral.id },
      data: { status: "CONVERTED", rewardPoints: points, convertedAt: new Date() },
    });

    // Award points + leaderboard + the "points earned" notification (idempotent
    // via eventKey inside the gamification engine).
    await GamificationEvents.referralConverted({ gymId, memberId: referral.referrerId, referralId: referral.id, points }).catch((e) => logger.warn("referralConverted award failed", { e: String(e) }));

    await NotificationService.create(gymId, {
      memberId: referral.referrerId,
      type: "GENERAL",
      title: "Referral successful! 🏆",
      message: `${member?.user?.name ?? referral.inviteeName ?? "Your referral"} activated their first membership. Your referral reward is now eligible.`,
    }).catch(() => undefined);

    return updated;
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
