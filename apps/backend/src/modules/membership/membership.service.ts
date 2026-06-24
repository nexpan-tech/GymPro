import { prisma } from "../../config/db";
import { MembershipPlan, MembershipStatus, Prisma } from "@prisma/client";
import { GamificationEvents } from "../gamification/engagement-events.service";
import { ReferralService } from "../referral/referral.service";
import { AppError } from "../../utils/response";
import {
  CreateMembershipInput,
  UpdateMembershipInput,
  RenewMembershipInput,
  FreezeMembershipInput,
  ExtendMembershipInput,
} from "./membership.validation";

const PLAN_DURATION_DAYS: Record<MembershipPlan, number> = {
  MONTHLY: 30,
  QUARTERLY: 90,
  HALF_YEARLY: 180,
  YEARLY: 365,
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffInDays(later: Date, earlier: Date): number {
  return Math.round((later.getTime() - earlier.getTime()) / 86_400_000);
}

const membershipInclude = {
  member: { include: { user: true } },
  planRef: true,
} as const;

type MembershipRecord = {
  status: MembershipStatus;
  endDate: Date;
};

export class MembershipService {
  /**
   * Derive the *live* status without writing to the DB. FROZEN/CANCELLED are
   * sticky; otherwise a past end date means EXPIRED.
   */
  static computeStatus(
    m: MembershipRecord,
    now: Date = new Date()
  ): MembershipStatus {
    if (m.status === "FROZEN" || m.status === "CANCELLED") return m.status;
    return new Date(m.endDate).getTime() < now.getTime() ? "EXPIRED" : "ACTIVE";
  }

  private static decorate<T extends MembershipRecord & { endDate: Date }>(m: T) {
    const now = new Date();
    return {
      ...m,
      effectiveStatus: this.computeStatus(m, now),
      daysRemaining: Math.max(0, diffInDays(new Date(m.endDate), now)),
    };
  }

  private static async resolvePlan(gymId: string, planId: string) {
    const plan = await prisma.gymMembershipPlan.findFirst({
      where: { id: planId, gymId },
    });
    if (!plan) {
      throw new AppError("Membership plan not found in this gym", 404);
    }
    return plan;
  }

  /**
   * End every currently-OPEN membership (ACTIVE or FROZEN) for a member as of
   * `asOf` — marks them EXPIRED and cuts endDate to `asOf` so neither the
   * persisted status nor the derived/effective status ever counts them active.
   * The rows stay in history. Guarantees one active membership per member.
   */
  private static async supersedeOpenMemberships(
    tx: Prisma.TransactionClient,
    gymId: string,
    memberId: string,
    asOf: Date,
  ) {
    await tx.membership.updateMany({
      where: { gymId, memberId, status: { in: ["ACTIVE", "FROZEN"] } },
      data: { status: "EXPIRED", endDate: asOf },
    });
  }

  /**
   * One-time data reconciliation: collapse pre-existing DUPLICATE active
   * memberships so each member keeps only their most-recent active one; older
   * actives become EXPIRED (ended now). Safe to re-run (idempotent once clean).
   * Returns how many duplicate actives were ended. No schema change.
   */
  static async reconcileActiveMemberships(gymId?: string) {
    const now = new Date();
    const where = gymId ? { gymId } : {};
    // All memberships that are currently effective-ACTIVE (status ACTIVE/FROZEN
    // not yet lapsed, or any row whose endDate is still in the future).
    const open = await prisma.membership.findMany({
      where: { ...where, status: { in: ["ACTIVE", "FROZEN"] }, endDate: { gte: now } },
      select: { id: true, memberId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    const keep = new Set<string>();
    const supersede: string[] = [];
    for (const m of open) {
      if (keep.has(m.memberId)) supersede.push(m.id); // older duplicate
      else keep.add(m.memberId); // newest active for this member — keep
    }
    if (supersede.length > 0) {
      await prisma.membership.updateMany({
        where: { id: { in: supersede } },
        data: { status: "EXPIRED", endDate: now },
      });
    }
    return { membersWithActive: keep.size, duplicatesEnded: supersede.length };
  }

  static async create(gymId: string, data: CreateMembershipInput) {
    const member = await prisma.member.findFirst({
      where: { id: data.memberId, gymId },
    });
    if (!member) {
      throw new AppError("Member not found in this gym", 404);
    }

    // Is this the member's FIRST membership? Only the first activation can
    // complete a passive referral (registration alone never does).
    const priorMembershipCount = await prisma.membership.count({
      where: { gymId, memberId: data.memberId },
    });

    let durationDays: number;
    let amount: number;
    let planId: string | null = null;
    let planEnum: MembershipPlan | null = null;

    if (data.planId) {
      const plan = await this.resolvePlan(gymId, data.planId);
      durationDays = plan.durationDays;
      amount = data.amount ?? plan.price;
      planId = plan.id;
    } else if (data.plan) {
      durationDays = PLAN_DURATION_DAYS[data.plan];
      amount = data.amount ?? 0;
      planEnum = data.plan;
    } else {
      throw new AppError("A planId or plan is required", 400);
    }

    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const endDate = data.endDate
      ? new Date(data.endDate)
      : addDays(startDate, durationDays);

    // INVARIANT: a member may have only ONE active membership. Supersede any
    // currently-open membership (ACTIVE/FROZEN) before creating the new one —
    // the prior one is ended now and kept in history as EXPIRED. Atomic.
    const membership = await prisma.$transaction(async (tx) => {
      await this.supersedeOpenMemberships(tx, gymId, data.memberId, new Date());
      return tx.membership.create({
        data: {
          gymId,
          memberId: data.memberId,
          planId,
          plan: planEnum,
          startDate,
          endDate,
          amount,
          paymentStatus: data.paymentStatus ?? "PENDING",
          status: "ACTIVE",
        },
        include: membershipInclude,
      });
    });

    // Passive referral completion: a referral becomes Successful only when the
    // referred member activates their FIRST membership. Best-effort.
    if (priorMembershipCount === 0) {
      await ReferralService.onFirstMembershipActivated(gymId, data.memberId).catch(() => undefined);
    }

    return this.decorate(membership);
  }

  static async getAll(gymId: string, opts: { currentOnly?: boolean } = {}) {
    const memberships = await prisma.membership.findMany({
      where: { gymId },
      include: membershipInclude,
      orderBy: { createdAt: "desc" },
    });
    const decorated = memberships.map((m) => this.decorate(m));

    if (!opts.currentOnly) return decorated;

    // Collapse to the single most relevant membership per member so a renewed
    // member is not listed multiple times. Preference: ACTIVE > FROZEN >
    // anything else, then most recently created.
    const rank: Record<string, number> = { ACTIVE: 3, FROZEN: 2, EXPIRED: 1, CANCELLED: 0 };
    const byMember = new Map<string, (typeof decorated)[number]>();
    for (const m of decorated) {
      const existing = byMember.get(m.memberId);
      if (!existing) {
        byMember.set(m.memberId, m);
        continue;
      }
      const better =
        (rank[m.effectiveStatus] ?? 0) > (rank[existing.effectiveStatus] ?? 0) ||
        ((rank[m.effectiveStatus] ?? 0) === (rank[existing.effectiveStatus] ?? 0) &&
          new Date(m.createdAt).getTime() > new Date(existing.createdAt).getTime());
      if (better) byMember.set(m.memberId, m);
    }
    return Array.from(byMember.values());
  }

  static async getByMember(gymId: string, memberId: string) {
    const member = await prisma.member.findFirst({
      where: { id: memberId, gymId },
    });
    if (!member) {
      throw new AppError("Member not found in this gym", 404);
    }

    const memberships = await prisma.membership.findMany({
      where: { gymId, memberId },
      include: membershipInclude,
      orderBy: { createdAt: "desc" },
    });
    return memberships.map((m) => this.decorate(m));
  }

  /**
   * Member self-service view: the logged-in member's own memberships.
   * Returns the current (active, else most recent) membership plus full history.
   */
  static async getMyMemberships(user: { id: string; gymId: string | null }) {
    if (!user.gymId) {
      return { current: null, history: [] as ReturnType<typeof MembershipService.decorate>[] };
    }

    const member = await prisma.member.findFirst({
      where: { userId: user.id, gymId: user.gymId },
    });
    if (!member) {
      return { current: null, history: [] as ReturnType<typeof MembershipService.decorate>[] };
    }

    const memberships = await prisma.membership.findMany({
      where: { memberId: member.id },
      include: membershipInclude,
      orderBy: { createdAt: "desc" },
    });

    const history = memberships.map((m) => this.decorate(m));
    const current =
      history.find((m) => m.effectiveStatus === "ACTIVE") ??
      history.find((m) => m.effectiveStatus === "FROZEN") ??
      history[0] ??
      null;

    return { current, history };
  }

  static async getById(gymId: string, id: string) {
    const membership = await prisma.membership.findFirst({
      where: { id, gymId },
      include: membershipInclude,
    });
    if (!membership) {
      throw new AppError("Membership not found", 404);
    }
    return this.decorate(membership);
  }

  static async update(gymId: string, id: string, data: UpdateMembershipInput) {
    const membership = await prisma.membership.findFirst({
      where: { id, gymId },
    });
    if (!membership) {
      throw new AppError("Membership not found", 404);
    }

    const updated = await prisma.membership.update({
      where: { id },
      data: {
        plan: data.plan,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        amount: data.amount,
        paymentStatus: data.paymentStatus,
        status: data.status,
      },
      include: membershipInclude,
    });
    return this.decorate(updated);
  }

  /**
   * Renew: create a new membership that chains from the old one. The new term
   * continues from the old end date if it hasn't lapsed yet, otherwise from now.
   * The previous membership is marked EXPIRED.
   */
  static async renew(gymId: string, id: string, data: RenewMembershipInput) {
    const old = await prisma.membership.findFirst({
      where: { id, gymId },
    });
    if (!old) {
      throw new AppError("Membership not found", 404);
    }

    let durationDays: number;
    let amount: number;
    let planId: string | null = null;
    let planEnum: MembershipPlan | null = null;

    const targetPlanId = data.planId ?? old.planId;
    if (targetPlanId) {
      const plan = await this.resolvePlan(gymId, targetPlanId);
      durationDays = plan.durationDays;
      amount = data.amount ?? plan.price;
      planId = plan.id;
    } else if (old.plan) {
      durationDays = PLAN_DURATION_DAYS[old.plan];
      amount = data.amount ?? old.amount;
      planEnum = old.plan;
    } else {
      throw new AppError("Cannot determine plan for renewal", 400);
    }

    const now = new Date();
    const startDate = data.startDate
      ? new Date(data.startDate)
      : new Date(old.endDate).getTime() > now.getTime()
        ? new Date(old.endDate)
        : now;
    const endDate = addDays(startDate, durationDays);

    const created = await prisma.$transaction(async (tx) => {
      // End ALL of the member's open memberships (not just the one passed) so a
      // renewal can never leave two active rows behind.
      await this.supersedeOpenMemberships(tx, gymId, old.memberId, now);

      return tx.membership.create({
        data: {
          gymId,
          memberId: old.memberId,
          planId,
          plan: planEnum,
          startDate,
          endDate,
          amount,
          paymentStatus: data.paymentStatus ?? "PENDING",
          status: "ACTIVE",
          renewedFromId: old.id,
        },
        include: membershipInclude,
      });
    });

    // Stage 8 — award loyalty points for renewing (best-effort, idempotent).
    await GamificationEvents.membershipRenewed({ gymId, memberId: created.memberId, membershipId: created.id });

    return this.decorate(created);
  }

  /**
   * Freeze: pause the membership. When a freeze end date is supplied we push the
   * membership end date out by the freeze span so the member keeps their days.
   */
  static async freeze(gymId: string, id: string, data: FreezeMembershipInput) {
    const membership = await prisma.membership.findFirst({
      where: { id, gymId },
    });
    if (!membership) {
      throw new AppError("Membership not found", 404);
    }

    const freezeStartDate = data.freezeStartDate
      ? new Date(data.freezeStartDate)
      : new Date();
    const freezeEndDate = data.freezeEndDate
      ? new Date(data.freezeEndDate)
      : null;

    let endDate = membership.endDate;
    if (freezeEndDate) {
      const frozenDays = Math.max(0, diffInDays(freezeEndDate, freezeStartDate));
      endDate = addDays(membership.endDate, frozenDays);
    }

    const updated = await prisma.membership.update({
      where: { id },
      data: {
        status: "FROZEN",
        freezeStartDate,
        freezeEndDate,
        endDate,
      },
      include: membershipInclude,
    });
    return this.decorate(updated);
  }

  /** Extend: add days to the term (and reactivate if it had expired). */
  static async extend(gymId: string, id: string, data: ExtendMembershipInput) {
    const membership = await prisma.membership.findFirst({
      where: { id, gymId },
    });
    if (!membership) {
      throw new AppError("Membership not found", 404);
    }

    const endDate = addDays(membership.endDate, data.days);
    const now = new Date();
    const nextStatus =
      membership.status === "CANCELLED"
        ? membership.status
        : endDate.getTime() > now.getTime()
          ? "ACTIVE"
          : membership.status;

    const updated = await prisma.membership.update({
      where: { id },
      data: {
        endDate,
        extensionDays: membership.extensionDays + data.days,
        status: nextStatus,
      },
      include: membershipInclude,
    });
    return this.decorate(updated);
  }

  static async delete(gymId: string, id: string) {
    const membership = await prisma.membership.findFirst({
      where: { id, gymId },
    });
    if (!membership) {
      throw new AppError("Membership not found", 404);
    }
    // Cancel rather than hard-delete to preserve history.
    await prisma.membership.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    return { id, status: "CANCELLED" as const };
  }

  /** Membership lifecycle analytics for the gym dashboard. */
  static async analytics(gymId: string) {
    const now = new Date();
    const in7 = addDays(now, 7);
    const in30 = addDays(now, 30);

    const [members, memberships, branches] = await Promise.all([
      prisma.member.findMany({
        where: { gymId },
        select: { id: true, status: true, branchId: true },
      }),
      prisma.membership.findMany({
        where: { gymId },
        select: { memberId: true, status: true, endDate: true },
      }),
      prisma.branch.findMany({
        where: { gymId },
        select: { id: true, name: true },
      }),
    ]);

    const membersWithActive = new Set<string>();
    let activeMemberships = 0;
    let expiredMemberships = 0;
    let frozenMemberships = 0;
    let renewalsDueThisWeek = 0;
    let renewalsDueThisMonth = 0;

    for (const m of memberships) {
      const status = this.computeStatus(m, now);
      if (status === "ACTIVE") {
        activeMemberships += 1;
        membersWithActive.add(m.memberId);
        const end = new Date(m.endDate);
        if (end <= in30) renewalsDueThisMonth += 1;
        if (end <= in7) renewalsDueThisWeek += 1;
      } else if (status === "EXPIRED") {
        expiredMemberships += 1;
      } else if (status === "FROZEN") {
        frozenMemberships += 1;
      }
    }

    const branchCounts = branches.map((b) => ({
      branchId: b.id,
      branchName: b.name,
      memberCount: members.filter((m) => m.branchId === b.id).length,
    }));

    return {
      totalMembers: members.length,
      activeMembers: membersWithActive.size,
      inactiveMembers: members.filter((m) => m.status === "INACTIVE").length,
      expiredMembers: members.length - membersWithActive.size,
      activeMemberships,
      expiredMemberships,
      frozenMemberships,
      renewalsDueThisWeek,
      renewalsDueThisMonth,
      branchCounts,
    };
  }
}
