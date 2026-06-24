import { AuditAction } from "@prisma/client";
import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import { logger } from "../../config/logger";
import { createAuditLog } from "../../utils/audit";
import { PlatformSettingsService } from "../super-admin/platform-settings.service";
import { generateSaaSInvoicePdf } from "../reports/pdf.service";
import { sendEmail } from "../email/email.service";
import { FEATURE_CATALOGUE } from "../feature-flag/feature-flag.service";
import { notifyLicenseEvent } from "./license.notifications";

/**
 * Default SaaS license tiers. Auto-seeded the first time the catalogue is read
 * so a fresh deployment never shows an empty Subscriptions page. Idempotent —
 * keyed by name, so re-running never duplicates. Enterprise uses price 0 to mean
 * "custom pricing" (excluded from auto-invoicing + MRR) and null caps =
 * unlimited. No schema change — these are plain SaaSPlan rows.
 */
export const DEFAULT_PLANS: Array<{
  name: string; description: string; interval: "MONTHLY" | "YEARLY"; price: number;
  maxMembers: number | null; maxBranches: number | null; maxStaff: number | null;
}> = [
  { name: "Starter",      description: "For new, single-location gyms getting started.", interval: "MONTHLY", price: 999,  maxMembers: 100,  maxBranches: 1,    maxStaff: 5 },
  { name: "Growth",       description: "For growing studios scaling membership & engagement.", interval: "MONTHLY", price: 1999, maxMembers: 300,  maxBranches: 3,    maxStaff: 15 },
  { name: "Professional", description: "For established multi-branch fitness businesses.", interval: "MONTHLY", price: 3999, maxMembers: 700,  maxBranches: 10,   maxStaff: 50 },
  { name: "Enterprise",   description: "Custom pricing. Unlimited members, branches & staff.", interval: "MONTHLY", price: 0,    maxMembers: null, maxBranches: null, maxStaff: null },
];

/**
 * Which platform feature flags each default plan tier ENABLES. Drives per-gym
 * FeatureFlagAssignment whenever a plan is assigned, so the subscription plan
 * controls feature availability (UI hides + APIs gated via featureEnabled).
 * Keys must exist in FEATURE_CATALOGUE. "Members/Attendance/Memberships/Payments"
 * are core and never gated; capacity (members/branches/staff) is enforced by the
 * numeric plan caps, not flags.
 */
const STARTER_FEATURES = ["billing", "progress", "goals", "workout-builder", "diet-builder", "chat", "announcements", "analytics", "reports"];
const GROWTH_FEATURES = [...STARTER_FEATURES, "referral", "leaderboard", "gamification", "community", "crm", "automation"];
const PROFESSIONAL_FEATURES = [...GROWTH_FEATURES, "white-label", "advanced-reports", "retention", "ai", "personal-plans"];
export const PLAN_FEATURE_MATRIX: Record<string, string[]> = {
  Starter: STARTER_FEATURES,
  Growth: GROWTH_FEATURES,
  Professional: PROFESSIONAL_FEATURES,
  Enterprise: FEATURE_CATALOGUE.map((f) => f.key), // everything
};

/** Human-facing extras shown on plan cards (derived from tier, not stored). */
export const PLAN_PERKS: Record<string, { storageGb: number | null; customBranding: boolean; prioritySupport: boolean }> = {
  Starter:      { storageGb: 5,    customBranding: false, prioritySupport: false },
  Growth:       { storageGb: 25,   customBranding: false, prioritySupport: false },
  Professional: { storageGb: 100,  customBranding: true,  prioritySupport: true },
  Enterprise:   { storageGb: null, customBranding: true,  prioritySupport: true },
};

/**
 * License-based SaaS billing (GymPro → Gyms).
 *
 *   monthlyAmount = licensePlan.price          (FLAT — never per-member)
 *   gstAmount     = monthlyAmount × gym.gstPercent / 100
 *   total         = monthlyAmount + gstAmount
 *
 * A license (SaaSPlan) defines the MAXIMUM ACTIVE MEMBERS a gym may have
 * (SaaSPlan.maxMembers). Active members = Member.status === "ACTIVE". Usage,
 * attendance, payments and QR scans never affect billing or capacity.
 *
 * Reuses the existing SaaSPlan / GymSubscription / SaaSInvoice models — no
 * schema change. The legacy per-active-member engine
 * (super-admin/saas-billing.service) is retained only for historical data.
 */

export interface BillingActor {
  userId?: string | null;
  role?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  source?: "manual" | "auto";
}

function round(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function currentBillingMonth(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function addInterval(date: Date, interval: "MONTHLY" | "YEARLY") {
  const next = new Date(date);
  if (interval === "YEARLY") next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

/** Utilization tier thresholds straight from the product spec. */
export type LicenseTier = "HEALTHY" | "APPROACHING_CAPACITY" | "UPGRADE_RECOMMENDED" | "FULL";
export function licenseTier(utilizationPct: number): LicenseTier {
  if (utilizationPct >= 100) return "FULL";
  if (utilizationPct >= 90) return "UPGRADE_RECOMMENDED";
  if (utilizationPct >= 80) return "APPROACHING_CAPACITY";
  return "HEALTHY";
}

export function tierMessage(tier: LicenseTier): string {
  switch (tier) {
    case "FULL": return "License Full";
    case "UPGRADE_RECOMMENDED": return "Upgrade Recommended";
    case "APPROACHING_CAPACITY": return "Approaching Capacity";
    default: return "Healthy";
  }
}

/** Active member count = Member.status === "ACTIVE" (the platform-wide rule). */
async function activeMemberCount(gymId: string): Promise<number> {
  return prisma.member.count({ where: { gymId, status: "ACTIVE" } });
}

async function activeMemberCounts(): Promise<Map<string, number>> {
  const rows = await prisma.member.groupBy({
    by: ["gymId"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.gymId, r._count._all]));
}

// Staff = every non-member login that occupies a seat (admins, managers,
// receptionists, trainers). Reuses the aggregate SaaSPlan.maxStaff cap.
const STAFF_ROLES = ["ADMIN", "BRANCH_MANAGER", "REGIONAL_MANAGER", "RECEPTIONIST", "TRAINER"] as const;

async function branchCount(gymId: string): Promise<number> {
  return prisma.branch.count({ where: { gymId } });
}
async function staffCount(gymId: string): Promise<number> {
  return prisma.user.count({ where: { gymId, isActive: true, role: { in: STAFF_ROLES as unknown as never } } });
}
async function branchCounts(): Promise<Map<string, number>> {
  const rows = await prisma.branch.groupBy({ by: ["gymId"], _count: { _all: true } });
  return new Map(rows.map((r) => [r.gymId, r._count._all]));
}
async function staffCounts(): Promise<Map<string, number>> {
  const rows = await prisma.user.groupBy({ by: ["gymId"], where: { isActive: true, role: { in: STAFF_ROLES as unknown as never } }, _count: { _all: true } });
  return new Map(rows.map((r) => [r.gymId ?? "", r._count._all]));
}

function effectiveInvoiceStatus(inv: { status: string; dueDate: Date }): string {
  if (inv.status === "PAID" || inv.status === "CANCELLED") return inv.status;
  if (inv.dueDate < new Date()) return "OVERDUE";
  return inv.status;
}

function computeUtilization(active: number, capacity: number | null | undefined) {
  if (!capacity || capacity <= 0) {
    return { capacity: null as number | null, active, remaining: null as number | null, utilizationPct: 0, tier: "HEALTHY" as LicenseTier };
  }
  const remaining = Math.max(0, capacity - active);
  const utilizationPct = Math.round((active / capacity) * 100);
  return { capacity, active, remaining, utilizationPct, tier: licenseTier(utilizationPct) };
}

export class LicenseService {
  // ── Plan (license) catalogue ─────────────────────────────────────────────

  /**
   * Idempotently create the default tiers if the catalogue is empty. Safe to
   * call on every read — only inserts the names that don't already exist.
   */
  static async seedDefaultPlans() {
    const existing = await prisma.saaSPlan.findMany({ select: { name: true } });
    const have = new Set(existing.map((p) => p.name.toLowerCase()));
    const missing = DEFAULT_PLANS.filter((p) => !have.has(p.name.toLowerCase()));
    if (missing.length === 0) return prisma.saaSPlan.findMany({ orderBy: { price: "asc" } });
    await prisma.saaSPlan.createMany({ data: missing });
    logger.info(`[license] seeded ${missing.length} default plan(s): ${missing.map((p) => p.name).join(", ")}`);
    return prisma.saaSPlan.findMany({ orderBy: { price: "asc" } });
  }

  static async listPlans(includeInactive = false) {
    let plans = await prisma.saaSPlan.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { price: "asc" },
    });
    // A production SaaS must never present an empty plan catalogue — seed the
    // defaults on first access so the Subscriptions page always has plans.
    if (plans.length === 0) {
      await this.seedDefaultPlans();
      plans = await prisma.saaSPlan.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: { price: "asc" },
      });
    }
    return plans;
  }

  static async createPlan(data: {
    name: string; description?: string; interval: "MONTHLY" | "YEARLY"; price: number;
    maxMembers?: number; maxBranches?: number; maxStaff?: number;
  }, actor: BillingActor = {}) {
    const plan = await prisma.saaSPlan.create({
      data: {
        name: data.name, description: data.description, interval: data.interval, price: data.price,
        maxMembers: data.maxMembers ?? null, maxBranches: data.maxBranches ?? null, maxStaff: data.maxStaff ?? null,
      },
    });
    await createAuditLog({
      gymId: null, userId: actor.userId ?? null, action: AuditAction.CREATE,
      entity: "SaaSPlan", entityId: plan.id, newData: { event: "LICENSE_PLAN_CREATED", name: plan.name, price: plan.price, maxMembers: plan.maxMembers },
      ipAddress: actor.ip ?? null, userAgent: actor.userAgent ?? null,
    });
    return plan;
  }

  static async updatePlan(id: string, data: Partial<{
    name: string; description: string; interval: "MONTHLY" | "YEARLY"; price: number;
    maxMembers: number | null; maxBranches: number | null; maxStaff: number | null; isActive: boolean;
  }>, actor: BillingActor = {}) {
    const existing = await prisma.saaSPlan.findUnique({ where: { id } });
    if (!existing) throw new AppError("License plan not found", 404);
    const plan = await prisma.saaSPlan.update({ where: { id }, data });
    await createAuditLog({
      gymId: null, userId: actor.userId ?? null, action: AuditAction.UPDATE,
      entity: "SaaSPlan", entityId: plan.id, newData: { event: "LICENSE_PLAN_UPDATED", changes: data },
      ipAddress: actor.ip ?? null, userAgent: actor.userAgent ?? null,
    });
    return plan;
  }

  // ── License summary (one gym) ────────────────────────────────────────────

  static async getCurrentSubscription(gymId: string) {
    return prisma.gymSubscription.findFirst({
      where: { gymId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Full license card for a single gym (super-admin detail or gym-admin self-view). */
  static async getGymLicense(gymId: string) {
    const [gym, subscription, active, branches, staff, invoices, settings] = await Promise.all([
      prisma.gym.findUnique({ where: { id: gymId }, select: { id: true, name: true, email: true, gstPercent: true, gstNumber: true, isActive: true } }),
      this.getCurrentSubscription(gymId),
      activeMemberCount(gymId),
      branchCount(gymId),
      staffCount(gymId),
      prisma.saaSInvoice.findMany({ where: { gymId }, orderBy: { createdAt: "desc" }, take: 12 }),
      PlatformSettingsService.get(),
    ]);
    if (!gym) throw new AppError("Gym not found", 404);

    const plan = subscription?.plan ?? null;
    const util = computeUtilization(active, plan?.maxMembers);
    const branchUtil = computeUtilization(branches, plan?.maxBranches);
    const staffUtil = computeUtilization(staff, plan?.maxStaff);
    const latest = invoices[0] ?? null;
    const lastPaid = invoices.find((i) => i.status === "PAID") ?? null;
    const pendingAmount = round(
      invoices.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED").reduce((s, i) => s + i.totalAmount, 0),
    );

    const now = new Date();
    const isTrial = subscription?.status === "TRIALING";
    const trialExpired = isTrial && subscription!.endDate < now;
    const gstPercent = gym.gstPercent ?? 0;
    const monthlyPrice = plan?.price ?? 0;
    const nextInvoiceTotal = round(monthlyPrice + (monthlyPrice * gstPercent) / 100);

    return {
      gymId: gym.id,
      gymName: gym.name,
      ownerEmail: gym.email,
      license: plan
        ? {
            subscriptionId: subscription!.id,
            planId: plan.id,
            name: plan.name,
            capacity: plan.maxMembers,
            monthlyPrice,
            interval: plan.interval,
            gstPercent,
            gstEnabled: gstPercent > 0,
            status: subscription!.status,
            autoRenew: subscription!.autoRenew,
            startDate: subscription!.startDate,
            renewalDate: subscription!.endDate,
            isTrial,
            trialEndsAt: isTrial ? subscription!.endDate : null,
            trialExpired,
            invoicePrefix: settings.invoicePrefix,
          }
        : null,
      usage: {
        activeMembers: util.active,
        capacity: util.capacity,
        remaining: util.remaining,
        utilizationPct: util.utilizationPct,
        tier: util.tier,
        tierMessage: tierMessage(util.tier),
        // Enterprise dimensions (reuse existing plan caps).
        branches: { used: branchUtil.active, capacity: branchUtil.capacity, remaining: branchUtil.remaining, utilizationPct: branchUtil.utilizationPct, tier: branchUtil.tier },
        staff: { used: staffUtil.active, capacity: staffUtil.capacity, remaining: staffUtil.remaining, utilizationPct: staffUtil.utilizationPct, tier: staffUtil.tier },
      },
      billing: {
        billingStatus: latest ? effectiveInvoiceStatus(latest) : "NOT_BILLED",
        lastInvoice: latest ? { id: latest.id, invoiceNumber: latest.invoiceNumber, billingMonth: latest.billingMonth, totalAmount: latest.totalAmount, status: effectiveInvoiceStatus(latest), dueDate: latest.dueDate, paidAt: latest.paidAt } : null,
        lastPaidDate: lastPaid?.paidAt ?? null,
        pendingAmount,
        nextInvoiceTotal,
      },
      invoices: invoices.map((i) => ({ ...i, effectiveStatus: effectiveInvoiceStatus(i) })),
    };
  }

  /** All gyms with their license + utilization + billing — the super-admin dashboard grid. */
  static async listLicenses() {
    const [gyms, counts, branchMap, staffMap, subscriptions, invoices] = await Promise.all([
      prisma.gym.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true, gstPercent: true, isActive: true } }),
      activeMemberCounts(),
      branchCounts(),
      staffCounts(),
      prisma.gymSubscription.findMany({ include: { plan: true }, orderBy: { createdAt: "desc" } }),
      prisma.saaSInvoice.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    // newest subscription + invoices per gym
    const subByGym = new Map<string, (typeof subscriptions)[number]>();
    for (const s of subscriptions) if (!subByGym.has(s.gymId)) subByGym.set(s.gymId, s);
    const invByGym = new Map<string, typeof invoices>();
    for (const i of invoices) { const l = invByGym.get(i.gymId) ?? []; l.push(i); invByGym.set(i.gymId, l); }

    return gyms.map((g) => {
      const sub = subByGym.get(g.id) ?? null;
      const plan = sub?.plan ?? null;
      const active = counts.get(g.id) ?? 0;
      const util = computeUtilization(active, plan?.maxMembers);
      const branchUtil = computeUtilization(branchMap.get(g.id) ?? 0, plan?.maxBranches);
      const staffUtil = computeUtilization(staffMap.get(g.id) ?? 0, plan?.maxStaff);
      const gymInvoices = invByGym.get(g.id) ?? [];
      const latest = gymInvoices[0] ?? null;
      const lastPaid = gymInvoices.find((i) => i.status === "PAID") ?? null;
      const gstPercent = g.gstPercent ?? 0;
      const monthlyPrice = plan?.price ?? 0;

      return {
        gymId: g.id,
        gymName: g.name,
        ownerEmail: g.email,
        licenseName: plan?.name ?? null,
        capacity: plan?.maxMembers ?? null,
        monthlyPrice,
        interval: plan?.interval ?? null,
        licenseStatus: sub?.status ?? "UNLICENSED",
        isTrial: sub?.status === "TRIALING",
        trialEndsAt: sub?.status === "TRIALING" ? sub.endDate : null,
        renewalDate: sub?.endDate ?? null,
        autoRenew: sub?.autoRenew ?? null,
        activeMembers: util.active,
        remaining: util.remaining,
        utilizationPct: util.utilizationPct,
        tier: util.tier,
        tierMessage: tierMessage(util.tier),
        branchUsage: { used: branchUtil.active, capacity: branchUtil.capacity, remaining: branchUtil.remaining, utilizationPct: branchUtil.utilizationPct },
        staffUsage: { used: staffUtil.active, capacity: staffUtil.capacity, remaining: staffUtil.remaining, utilizationPct: staffUtil.utilizationPct },
        billingStatus: latest ? effectiveInvoiceStatus(latest) : "NOT_BILLED",
        lastInvoiceDate: latest?.createdAt ?? null,
        lastPaidDate: lastPaid?.paidAt ?? null,
        nextInvoiceTotal: round(monthlyPrice + (monthlyPrice * gstPercent) / 100),
      };
    });
  }

  // ── License-based billing summary (the SaaS billing dashboard) ───────────

  /**
   * Platform billing metrics derived entirely from licenses + SaaS invoices —
   * NEVER from member counts. MRR sums the monthly-normalised plan price of
   * every ACTIVE license (yearly plans ÷ 12). This is the production source of
   * truth for MRR/ARR and the billing dashboard.
   */
  static async billingSummary() {
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [subscriptions, invoices, totalGyms] = await Promise.all([
      prisma.gymSubscription.findMany({ include: { plan: true, gym: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.saaSInvoice.findMany({ select: { status: true, totalAmount: true, dueDate: true, paidAt: true } }),
      prisma.gym.count(),
    ]);

    // Current (newest) subscription per gym = its single active license.
    const current = new Map<string, (typeof subscriptions)[number]>();
    for (const s of subscriptions) if (!current.has(s.gymId)) current.set(s.gymId, s);
    const licenses = [...current.values()];

    const monthly = (p?: { price: number; interval: string } | null) =>
      !p ? 0 : p.interval === "YEARLY" ? p.price / 12 : p.price;

    let mrr = 0;
    const counts = { active: 0, trial: 0, pastDue: 0, suspended: 0, expired: 0, cancelled: 0 };
    const upcoming: Array<{ gymId: string; gymName: string; planName: string; renewalDate: Date; amount: number }> = [];
    // Plan distribution: gyms currently on each plan (excludes ended licenses).
    const planDist = new Map<string, number>();

    for (const l of licenses) {
      switch (l.status) {
        case "ACTIVE": counts.active++; mrr += monthly(l.plan); break;
        case "TRIALING": counts.trial++; break;
        case "PAST_DUE": counts.pastDue++; mrr += monthly(l.plan); break;
        case "SUSPENDED": counts.suspended++; break;
        case "EXPIRED": counts.expired++; break;
        case "CANCELLED": counts.cancelled++; break;
      }
      if (!["CANCELLED", "EXPIRED"].includes(l.status) && l.plan?.name) {
        planDist.set(l.plan.name, (planDist.get(l.plan.name) ?? 0) + 1);
      }
      if ((l.status === "ACTIVE" || l.status === "PAST_DUE") && l.endDate >= now && l.endDate <= soon) {
        upcoming.push({ gymId: l.gymId, gymName: l.gym?.name ?? "—", planName: l.plan?.name ?? "—", renewalDate: l.endDate, amount: round(l.plan?.price ?? 0) });
      }
    }

    let paid = 0, pending = 0, overdue = 0, revenueThisMonth = 0;
    for (const i of invoices) {
      if (i.status === "PAID") {
        paid += i.totalAmount;
        if (i.paidAt && i.paidAt >= monthStart) revenueThisMonth += i.totalAmount;
      } else if (i.status === "CANCELLED") continue;
      else if (i.dueDate < now) overdue += i.totalAmount;
      else pending += i.totalAmount;
    }

    mrr = round(mrr);
    upcoming.sort((a, b) => a.renewalDate.getTime() - b.renewalDate.getTime());

    return {
      mrr,
      arr: round(mrr * 12),
      activeLicenses: counts.active,
      trialLicenses: counts.trial,
      pastDueLicenses: counts.pastDue,
      suspendedLicenses: counts.suspended,
      expiredLicenses: counts.expired,
      cancelledLicenses: counts.cancelled,
      licensedGyms: licenses.filter((l) => !["CANCELLED", "EXPIRED"].includes(l.status)).length,
      unlicensedGyms: Math.max(0, totalGyms - current.size),
      revenueThisMonth: round(revenueThisMonth),
      paid: round(paid),
      pending: round(pending),
      overdue: round(overdue),
      upcomingRenewals: upcoming.slice(0, 20),
      upcomingRenewalCount: upcoming.length,
      // Distributions for the billing dashboard charts (real counts).
      planDistribution: [...planDist.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      licenseDistribution: [
        { status: "ACTIVE", count: counts.active },
        { status: "TRIALING", count: counts.trial },
        { status: "PAST_DUE", count: counts.pastDue },
        { status: "SUSPENDED", count: counts.suspended },
        { status: "EXPIRED", count: counts.expired },
        { status: "CANCELLED", count: counts.cancelled },
      ].filter((d) => d.count > 0),
    };
  }

  // ── Capacity enforcement ─────────────────────────────────────────────────

  /**
   * Throws 403 LICENSE_LIMIT_REACHED when a gym is at/over its licensed
   * capacity. No-op when the gym has no license or an uncapped plan (so gyms
   * without an assigned license keep working — backward compatible).
   * Super Admin overrides by upgrading the plan; staff cannot bypass.
   */
  static async assertCapacity(gymId: string): Promise<void> {
    const sub = await this.getCurrentSubscription(gymId);
    const capacity = sub?.plan?.maxMembers;
    if (!capacity || capacity <= 0) return; // unlicensed / uncapped → allow
    if (sub && (sub.status === "SUSPENDED" || sub.status === "CANCELLED")) {
      throw new AppError("This gym's GymPro license is suspended. Please contact support to reactivate.", 403, {
        code: "LICENSE_SUSPENDED", planName: sub.plan!.name, capacity,
      });
    }
    const active = await activeMemberCount(gymId);
    if (active >= capacity) {
      throw new AppError(
        `License limit reached — your ${sub!.plan!.name} plan allows up to ${capacity} active members (currently ${active}). Please upgrade your plan to activate additional members.`,
        403,
        { code: "LICENSE_LIMIT_REACHED", dimension: "members", planName: sub!.plan!.name, capacity, current: active },
      );
    }
  }

  /**
   * Branch / staff capacity enforcement. Reuses the existing
   * SaaSPlan.maxBranches / SaaSPlan.maxStaff caps (zero schema change). No-op
   * when unlicensed or uncapped, so existing gyms keep working.
   */
  private static async assertDimension(
    gymId: string,
    dimension: "branches" | "staff",
    cap: number | null | undefined,
    planName: string,
    current: number,
    label: string,
  ): Promise<void> {
    if (!cap || cap <= 0) return;
    if (current >= cap) {
      throw new AppError(
        `License limit reached — your ${planName} plan allows up to ${cap} ${label} (currently ${current}). Please upgrade your license.`,
        403,
        { code: "LICENSE_LIMIT_REACHED", dimension, planName, capacity: cap, current },
      );
    }
  }

  static async assertBranchCapacity(gymId: string): Promise<void> {
    const sub = await this.getCurrentSubscription(gymId);
    const cap = sub?.plan?.maxBranches;
    if (!cap || cap <= 0) return;
    if (sub && (sub.status === "SUSPENDED" || sub.status === "CANCELLED")) {
      throw new AppError("This gym's GymPro license is suspended.", 403, { code: "LICENSE_SUSPENDED" });
    }
    await this.assertDimension(gymId, "branches", cap, sub!.plan!.name, await branchCount(gymId), "branches");
  }

  static async assertStaffCapacity(gymId: string): Promise<void> {
    const sub = await this.getCurrentSubscription(gymId);
    const cap = sub?.plan?.maxStaff;
    if (!cap || cap <= 0) return;
    if (sub && (sub.status === "SUSPENDED" || sub.status === "CANCELLED")) {
      throw new AppError("This gym's GymPro license is suspended.", 403, { code: "LICENSE_SUSPENDED" });
    }
    await this.assertDimension(gymId, "staff", cap, sub!.plan!.name, await staffCount(gymId), "staff members");
  }

  /** Plan comparison matrix from existing plan fields (members/branches/staff). */
  static async getPlanComparison() {
    const plans = await this.listPlans(true);
    return plans.map((p) => ({
      id: p.id, name: p.name, price: p.price, interval: p.interval, isActive: p.isActive,
      maxMembers: p.maxMembers, maxBranches: p.maxBranches, maxStaff: p.maxStaff,
    }));
  }

  // ── License lifecycle (assign / upgrade / downgrade / trial / suspend) ────

  /**
   * Assign or change a gym's license. Supersedes the current subscription
   * (kept in history) and starts a new one. `trialDays > 0` starts a TRIALING
   * license with billing disabled until the trial ends.
   */
  static async assignPlan(
    gymId: string,
    opts: { planId: string; trialDays?: number; autoRenew?: boolean },
    actor: BillingActor = {},
  ) {
    const gym = await prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) throw new AppError("Gym not found", 404);
    const plan = await prisma.saaSPlan.findFirst({ where: { id: opts.planId, isActive: true } });
    if (!plan) throw new AppError("License plan not found or inactive", 404);

    const previous = await this.getCurrentSubscription(gymId);
    const startDate = new Date();
    const trialDays = opts.trialDays ?? 0;
    const status = trialDays > 0 ? "TRIALING" : "ACTIVE";
    const endDate = trialDays > 0
      ? new Date(startDate.getTime() + trialDays * 24 * 60 * 60 * 1000)
      : addInterval(startDate, plan.interval);

    const result = await prisma.$transaction(async (tx) => {
      // Retire the old license (kept for history).
      if (previous && !["CANCELLED", "EXPIRED"].includes(previous.status)) {
        await tx.gymSubscription.update({ where: { id: previous.id }, data: { status: "CANCELLED" } });
      }
      return tx.gymSubscription.create({
        data: { gymId, planId: plan.id, status, startDate, endDate, autoRenew: opts.autoRenew ?? true },
        include: { plan: true },
      });
    });

    // The subscription plan controls feature availability — sync the gym's
    // per-gym feature flags to this tier. Non-fatal: a flag error must never
    // block the license change (capacity + billing are the source of truth).
    await this.applyPlanFeatures(gymId, plan.name).catch((err) =>
      logger.warn(`[license] applyPlanFeatures failed for gym ${gymId}`, { err: String(err) }),
    );

    const direction = previous?.plan
      ? plan.price > previous.plan.price ? "UPGRADE" : plan.price < previous.plan.price ? "DOWNGRADE" : "CHANGE"
      : "ASSIGN";

    await createAuditLog({
      gymId, userId: actor.userId ?? null, action: AuditAction.UPDATE,
      entity: "GymSubscription", entityId: result.id,
      newData: { event: `LICENSE_${direction}`, from: previous?.plan?.name ?? null, to: plan.name, capacity: plan.maxMembers, monthlyPrice: plan.price, trialDays, status },
      ipAddress: actor.ip ?? null, userAgent: actor.userAgent ?? null,
    });
    return result;
  }

  /**
   * Sync a gym's per-gym FeatureFlagAssignments to its plan tier (PLAN_FEATURE_MATRIX).
   * Enables features the tier includes, disables the rest. Only the default
   * named tiers map; custom plans leave flags untouched (so renaming/creating a
   * plan never silently disables features). Disabling a flag only hides UI /
   * gates APIs — it NEVER deletes data, so downgrades are non-destructive and
   * upgrades restore access instantly.
   */
  static async applyPlanFeatures(gymId: string, planName: string) {
    const allowed = PLAN_FEATURE_MATRIX[planName];
    if (!allowed) return; // custom/unknown plan → don't touch feature flags
    const allowedSet = new Set(allowed);
    await Promise.all(
      FEATURE_CATALOGUE.map((f) =>
        prisma.featureFlagAssignment.upsert({
          where: { flagKey_gymId: { flagKey: f.key, gymId } },
          update: { enabled: allowedSet.has(f.key) },
          create: { flagKey: f.key, gymId, enabled: allowedSet.has(f.key) },
        }),
      ),
    );
  }

  static async setStatus(gymId: string, status: "ACTIVE" | "SUSPENDED" | "CANCELLED", actor: BillingActor = {}) {
    const sub = await this.getCurrentSubscription(gymId);
    if (!sub) throw new AppError("This gym has no license assigned", 404);
    const updated = await prisma.gymSubscription.update({ where: { id: sub.id }, data: { status } });
    await createAuditLog({
      gymId, userId: actor.userId ?? null, action: AuditAction.UPDATE,
      entity: "GymSubscription", entityId: sub.id, newData: { event: `LICENSE_${status}`, previous: sub.status },
      ipAddress: actor.ip ?? null, userAgent: actor.userAgent ?? null,
    });
    return updated;
  }

  static async getLicenseHistory(gymId: string) {
    return prisma.gymSubscription.findMany({
      where: { gymId }, include: { plan: true }, orderBy: { createdAt: "desc" },
    });
  }

  // ── Trial management (license trials = GymSubscription.status TRIALING) ────

  /** Convert a TRIALING license to a paid ACTIVE one (billing starts now). */
  static async convertTrial(gymId: string, actor: BillingActor = {}) {
    const sub = await this.getCurrentSubscription(gymId);
    if (!sub) throw new AppError("This gym has no license assigned", 404);
    if (sub.status !== "TRIALING") throw new AppError("License is not on a trial", 400);
    const startDate = new Date();
    const endDate = addInterval(startDate, sub.plan?.interval ?? "MONTHLY");
    const updated = await prisma.gymSubscription.update({ where: { id: sub.id }, data: { status: "ACTIVE", startDate, endDate } });
    await createAuditLog({
      gymId, userId: actor.userId ?? null, action: AuditAction.UPDATE,
      entity: "GymSubscription", entityId: sub.id, newData: { event: "LICENSE_TRIAL_CONVERTED", plan: sub.plan?.name, renewalDate: endDate },
      ipAddress: actor.ip ?? null, userAgent: actor.userAgent ?? null,
    });
    return updated;
  }

  /** Extend an active trial by N days (push the trial end-date forward). */
  static async extendTrial(gymId: string, extraDays: number, actor: BillingActor = {}) {
    if (!Number.isFinite(extraDays) || extraDays <= 0 || extraDays > 365) throw new AppError("extraDays must be 1–365", 422);
    const sub = await this.getCurrentSubscription(gymId);
    if (!sub) throw new AppError("This gym has no license assigned", 404);
    if (sub.status !== "TRIALING") throw new AppError("License is not on a trial", 400);
    const base = Math.max(sub.endDate.getTime(), Date.now());
    const endDate = new Date(base + extraDays * 24 * 60 * 60 * 1000);
    const updated = await prisma.gymSubscription.update({ where: { id: sub.id }, data: { endDate } });
    await createAuditLog({
      gymId, userId: actor.userId ?? null, action: AuditAction.UPDATE,
      entity: "GymSubscription", entityId: sub.id, newData: { event: "LICENSE_TRIAL_EXTENDED", extraDays, trialEndsAt: endDate },
      ipAddress: actor.ip ?? null, userAgent: actor.userAgent ?? null,
    });
    return updated;
  }

  /** Renew the current license for another billing interval (ACTIVE from now). */
  static async renew(gymId: string, actor: BillingActor = {}) {
    const sub = await this.getCurrentSubscription(gymId);
    if (!sub) throw new AppError("This gym has no license assigned", 404);
    if (["CANCELLED"].includes(sub.status)) throw new AppError("A cancelled license cannot be renewed — assign a plan instead", 400);
    const startDate = new Date();
    const endDate = addInterval(startDate, sub.plan?.interval ?? "MONTHLY");
    const updated = await prisma.gymSubscription.update({ where: { id: sub.id }, data: { status: "ACTIVE", startDate, endDate } });
    await createAuditLog({
      gymId, userId: actor.userId ?? null, action: AuditAction.UPDATE,
      entity: "GymSubscription", entityId: sub.id, newData: { event: "LICENSE_RENEWED", plan: sub.plan?.name, renewalDate: endDate, previous: sub.status },
      ipAddress: actor.ip ?? null, userAgent: actor.userAgent ?? null,
    });
    return updated;
  }

  // ── Lifecycle automation (daily cron + manual super-admin trigger) ────────

  /**
   * Advance license states by date — the renewal/expiry/grace state machine.
   * Operates ONLY on the current license per gym. Pure status transitions +
   * reminder emails; never deletes data, never touches unlicensed gyms.
   *
   *   TRIALING, ended            → EXPIRED        (+ trial-expired email)
   *   TRIALING, ends ≤3d         → reminder only  (trial-ending-soon)
   *   ACTIVE,   term ended       → PAST_DUE       (+ renewal-due email)
   *   ACTIVE,   ends ≤7d         → reminder only  (renewal-due-soon)
   *   PAST_DUE, ended >grace(7d) → SUSPENDED      (+ suspended email)
   */
  static async runLifecycle(actor: BillingActor = { source: "auto" }) {
    const now = new Date();
    const GRACE_DAYS = 7, TRIAL_SOON = 3, RENEWAL_SOON = 7;
    const daysUntil = (d: Date) => Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    const subs = await prisma.gymSubscription.findMany({ include: { plan: true }, orderBy: { createdAt: "desc" } });
    const current = new Map<string, (typeof subs)[number]>();
    for (const s of subs) if (!current.has(s.gymId)) current.set(s.gymId, s);

    const result = { processed: current.size, trialExpired: 0, trialEndingSoon: 0, pastDue: 0, renewalDueSoon: 0, suspended: 0 };
    const transition = async (sub: (typeof subs)[number], status: string, event: string) => {
      await prisma.gymSubscription.update({ where: { id: sub.id }, data: { status: status as never } });
      await createAuditLog({
        gymId: sub.gymId, userId: actor.userId ?? null, action: AuditAction.UPDATE,
        entity: "GymSubscription", entityId: sub.id, newData: { event, previous: sub.status, plan: sub.plan?.name, source: "auto" },
        ipAddress: actor.ip ?? null, userAgent: actor.userAgent ?? null,
      });
    };

    for (const sub of current.values()) {
      const planName = sub.plan?.name ?? null;
      const end = sub.endDate;
      try {
        if (sub.status === "TRIALING") {
          if (end < now) { await transition(sub, "EXPIRED", "LICENSE_TRIAL_EXPIRED"); await notifyLicenseEvent(sub.gymId, "TRIAL_EXPIRED", { planName, date: end }); result.trialExpired++; }
          else if (daysUntil(end) <= TRIAL_SOON) { await notifyLicenseEvent(sub.gymId, "TRIAL_ENDING_SOON", { planName, date: end }); result.trialEndingSoon++; }
        } else if (sub.status === "ACTIVE") {
          if (end < now) { await transition(sub, "PAST_DUE", "LICENSE_PAST_DUE"); await notifyLicenseEvent(sub.gymId, "RENEWAL_DUE", { planName, date: end }); result.pastDue++; }
          else if (daysUntil(end) <= RENEWAL_SOON) { await notifyLicenseEvent(sub.gymId, "RENEWAL_DUE_SOON", { planName, date: end }); result.renewalDueSoon++; }
        } else if (sub.status === "PAST_DUE") {
          if (end.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000 < now.getTime()) { await transition(sub, "SUSPENDED", "LICENSE_SUSPENDED_AUTO"); await notifyLicenseEvent(sub.gymId, "LICENSE_SUSPENDED", { planName }); result.suspended++; }
        }
      } catch (err) {
        logger.warn(`[license-lifecycle] gym ${sub.gymId} transition failed`, { err: String(err) });
      }
    }

    await createAuditLog({
      gymId: null, userId: actor.userId ?? null, action: AuditAction.UPDATE,
      entity: "GymSubscription", entityId: "lifecycle", newData: { event: "LICENSE_LIFECYCLE_RUN", ...result, source: actor.source ?? "auto" },
      ipAddress: actor.ip ?? null, userAgent: actor.userAgent ?? null,
    });
    return result;
  }

  // ── Anti-abuse audit (monitoring only — never used for billing) ───────────

  /**
   * Monitoring view for Super Admin. Peak is DERIVED from the monthly
   * SaaSInvoice.activeMemberCount snapshots already on record + the current
   * count (zero-migration). Never used for billing.
   */
  static async getAudit(gymId: string) {
    const [current, snapshots, statusChanges] = await Promise.all([
      activeMemberCount(gymId),
      prisma.saaSInvoice.findMany({ where: { gymId, activeMemberCount: { not: null } }, select: { billingMonth: true, activeMemberCount: true }, orderBy: { billingMonth: "asc" } }),
      prisma.auditLog.findMany({
        where: { gymId, entityType: "Member" }, select: { action: true, createdAt: true, metadata: true },
        orderBy: { createdAt: "desc" }, take: 50,
      }).catch(() => []),
    ]);

    const monthly = snapshots.map((s) => ({ month: s.billingMonth, activeMembers: s.activeMemberCount ?? 0 }));
    const peakActiveMembers = Math.max(current, ...monthly.map((m) => m.activeMembers), 0);

    const sub = await this.getCurrentSubscription(gymId);
    const capacity = sub?.plan?.maxMembers ?? null;

    return {
      gymId,
      currentActiveMembers: current,
      peakActiveMembers,
      capacity,
      peakUtilizationPct: capacity ? Math.round((peakActiveMembers / capacity) * 100) : null,
      monthlyUtilization: monthly.map((m) => ({ ...m, utilizationPct: capacity ? Math.round((m.activeMembers / capacity) * 100) : null })),
      recentStatusChanges: statusChanges,
      note: "Monitoring only. Peak usage is never used for billing — billing is a flat license fee.",
    };
  }

  // ── License-based invoicing (FLAT plan price) ────────────────────────────

  /**
   * Generate one flat SaaS invoice per billable gym for the month.
   *   amount = license plan price (NOT per-member)
   * Idempotent + race-safe via the (gymId, billingMonth) unique constraint.
   * Skips gyms that are unlicensed, TRIALING, SUSPENDED or CANCELLED.
   */
  static async generateInvoices(month?: string, actor: BillingActor = {}) {
    const billingMonth = month || currentBillingMonth();
    const settings = await PlatformSettingsService.get();
    const seller = PlatformSettingsService.snapshot(settings);
    const counts = await activeMemberCounts();

    const subscriptions = await prisma.gymSubscription.findMany({
      where: { status: { in: ["ACTIVE", "PAST_DUE"] } },
      include: { plan: true, gym: { include: { users: { where: { role: "ADMIN" }, select: { email: true, name: true }, take: 1 } } } },
      orderBy: { createdAt: "desc" },
    });

    // Keep only the newest subscription per gym (in case of history rows).
    const seen = new Set<string>();
    const billable = subscriptions.filter((s) => (seen.has(s.gymId) ? false : (seen.add(s.gymId), true)));

    let created = 0, skipped = 0, totalBilled = 0;
    const results: Array<Record<string, unknown>> = [];

    for (const sub of billable) {
      const gym = sub.gym;
      const price = sub.plan?.price ?? 0;
      if (!gym.isActive || price <= 0) { skipped++; continue; }

      const existing = await prisma.saaSInvoice.findFirst({ where: { gymId: gym.id, billingMonth } });
      if (existing) { skipped++; continue; }

      const gstPercent = gym.gstPercent ?? 0;
      const amount = round(price);
      const gstAmount = round((amount * gstPercent) / 100);
      const total = round(amount + gstAmount);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (settings.dueDays ?? 15));
      const invoiceNumber = `${settings.invoicePrefix || "SAAS"}-${billingMonth.replace("-", "")}-${gym.id.slice(-6).toUpperCase()}`;
      const activeSnapshot = counts.get(gym.id) ?? 0; // recorded for audit only

      let invoice;
      try {
        invoice = await prisma.saaSInvoice.create({
          data: {
            gymId: gym.id, subscriptionId: sub.id, invoiceNumber,
            amount, gstAmount, totalAmount: total, status: "PENDING", dueDate, billingMonth,
            activeMemberCount: activeSnapshot, pricePerMember: null, gstPercent,
            sellerSnapshot: seller as object, pdfUrl: null,
          },
        });
      } catch (err: unknown) {
        if ((err as { code?: string })?.code === "P2002") { skipped++; continue; }
        throw err;
      }

      const pdfUrl = `/api/v1/super-admin/billing/invoices/${invoice.id}/pdf`;
      const to = gym.users[0]?.email ?? gym.email;
      const delivery = await this.emailInvoice(gym, sub.plan?.name ?? "License", invoice, to, seller);
      invoice = await prisma.saaSInvoice.update({
        where: { id: invoice.id },
        data: { pdfUrl, emailStatus: delivery.status, sentAt: delivery.status === "SENT" ? new Date() : null, status: delivery.status === "SENT" ? "SENT" : "PENDING" },
      });

      await createAuditLog({
        gymId: gym.id, userId: actor.userId ?? null, action: AuditAction.CREATE,
        entity: "SaaSInvoice", entityId: invoice.id,
        newData: { event: "LICENSE_INVOICE_GENERATED", invoiceNumber, billingMonth, licenseName: sub.plan?.name, totalAmount: total, source: actor.source ?? "manual" },
        ipAddress: actor.ip ?? null, userAgent: actor.userAgent ?? null,
      });

      created++; totalBilled = round(totalBilled + total);
      results.push({ gymId: gym.id, gymName: gym.name, invoiceNumber, licenseName: sub.plan?.name, monthlyPrice: price, totalAmount: total, emailStatus: delivery.status });
    }

    return { billingMonth, created, skipped, totalBilled, invoices: results };
  }

  private static async emailInvoice(
    gym: { name: string; gstNumber?: string | null; email?: string | null; address?: string | null },
    licenseName: string,
    invoice: { invoiceNumber: string; billingMonth: string | null; amount: number; gstAmount: number; gstPercent: number | null; totalAmount: number; dueDate: Date },
    to: string,
    seller: Record<string, unknown>,
  ): Promise<{ status: "SENT" | "SKIPPED" | "FAILED"; reason?: string }> {
    if (!to) return { status: "SKIPPED", reason: "No billing email on file" };
    const html = `
      <h2>${(seller?.companyName as string) ?? "GymPro"} — SaaS License Invoice ${invoice.billingMonth}</h2>
      <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
      <p><strong>Gym:</strong> ${gym.name}${gym.gstNumber ? ` (GSTIN ${gym.gstNumber})` : ""}</p>
      <table cellpadding="6" style="border-collapse:collapse" border="1">
        <tr><td>License plan</td><td>${licenseName}</td></tr>
        <tr><td>Monthly license fee</td><td>₹${invoice.amount}</td></tr>
        <tr><td>GST (${invoice.gstPercent ?? 0}%)</td><td>₹${invoice.gstAmount}</td></tr>
        <tr><td><strong>Total payable</strong></td><td><strong>₹${invoice.totalAmount}</strong></td></tr>
        <tr><td>Due date</td><td>${new Date(invoice.dueDate).toLocaleDateString("en-IN")}</td></tr>
      </table>
      <p style="color:#666">${(seller?.invoiceFooter as string) ?? "Thank you for your business."}</p>`;

    let attachments: { filename: string; content: Buffer }[] | undefined;
    try {
      const pdf = await generateSaaSInvoicePdf(invoice, seller ?? {}, gym);
      attachments = [{ filename: `${invoice.invoiceNumber}.pdf`, content: pdf }];
    } catch (err) {
      logger.warn("License invoice PDF attach failed, sending HTML only", { invoice: invoice.invoiceNumber, err: String(err) });
    }

    const subject = `${(seller?.companyName as string) ?? "GymPro"} Invoice ${invoice.invoiceNumber} — ₹${invoice.totalAmount}`;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = (await sendEmail({ to, subject, html, attachments })) as { skipped?: boolean } | undefined;
        if (result?.skipped) return { status: "SKIPPED", reason: "Email provider not configured" };
        return { status: "SENT" };
      } catch (err) {
        logger.warn(`License invoice email attempt ${attempt}/3 failed`, { invoice: invoice.invoiceNumber, err: String(err) });
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
    return { status: "FAILED", reason: "Email send error after 3 attempts" };
  }
}
