import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import type { RiskLevel } from "@prisma/client";
import { ChurnPredictionService } from "./churnPrediction.service";
import { RenewalPredictionService } from "./renewalPrediction.service";

type AuthUser = { id: string; role: string; gymId: string | null };

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function diffInDays(a: Date, b: Date) {
  return Math.floor((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86_400_000);
}
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

/**
 * Normalised, dependency-free snapshot of one member's engagement signals.
 * Kept separate from Prisma so the scoring is pure and unit-testable.
 */
export interface MemberScoreInput {
  daysSinceLastAttendance: number | null; // null = never attended
  attendanceLast30: number;
  workoutCompletions: number;
  dietCompletions: number;
  progressUpdatesLast90: number;
  membershipExpired: boolean;
  pendingDue: number;
  renewalCount: number; // memberships beyond the first
}

export interface MemberScoreResult {
  retentionScore: number; // 0–100, higher = more engaged / likely to stay
  riskScore: number; // 0–100, higher = more likely to churn
  riskLevel: RiskLevel;
}

export function riskLevelFromScore(riskScore: number): RiskLevel {
  if (riskScore >= 75) return "CRITICAL";
  if (riskScore >= 50) return "HIGH";
  if (riskScore >= 25) return "MEDIUM";
  return "LOW";
}

/**
 * Deterministic, rule-based retention + churn scoring (no AI yet).
 * Retention rewards engagement; risk accumulates churn signals.
 */
export function computeMemberScores(input: MemberScoreInput): MemberScoreResult {
  // ── Retention (positive engagement) ──
  let retention = 0;
  retention += Math.min(input.attendanceLast30 * 4, 35); // consistency
  retention += Math.min(input.workoutCompletions * 4, 20); // workout completion
  retention += Math.min(input.dietCompletions * 3, 15); // diet adherence
  retention += Math.min(input.progressUpdatesLast90 * 5, 15); // progress updates
  retention += Math.min(input.renewalCount * 8, 15); // renewal loyalty

  // ── Risk (churn signals) ──
  let risk = 0;
  const d = input.daysSinceLastAttendance;
  if (d === null || d >= 30) risk += 40;
  else if (d >= 14) risk += 25;
  else if (d >= 7) risk += 12;

  if (input.membershipExpired) risk += 25;
  if (input.pendingDue > 0) risk += 20;
  if (input.workoutCompletions === 0) risk += 10;
  if (input.progressUpdatesLast90 === 0) risk += 5;

  const riskScore = clamp(risk);
  return {
    retentionScore: clamp(retention),
    riskScore,
    riskLevel: riskLevelFromScore(riskScore),
  };
}

type MemberWithSignals = {
  id: string;
  attendances: { date: Date }[];
  workoutCompletions: { id: string }[];
  dietCompletions: { id: string }[];
  bodyMeasurements: { recordedAt?: Date | null; createdAt?: Date | null }[];
  dues: { balance: number | null }[];
  memberships: { endDate: Date }[];
};

function buildSnapshot(member: MemberWithSignals, now = new Date()): MemberScoreInput {
  const last = member.attendances[0];
  const daysSinceLastAttendance = last ? diffInDays(now, last.date) : null;

  const since30 = startOfDay(now);
  since30.setDate(since30.getDate() - 30);
  const attendanceLast30 = member.attendances.filter((a) => a.date >= since30).length;

  const since90 = startOfDay(now);
  since90.setDate(since90.getDate() - 90);
  const progressUpdatesLast90 = member.bodyMeasurements.filter((m) => {
    const t = m.recordedAt ?? m.createdAt ?? null;
    return t ? new Date(t) >= since90 : false;
  }).length;

  const pendingDue = member.dues.reduce((s, d) => s + Number(d.balance ?? 0), 0);
  const latestMembership = member.memberships[0];
  const membershipExpired = latestMembership ? latestMembership.endDate < now : true;
  const renewalCount = Math.max(0, member.memberships.length - 1);

  return {
    daysSinceLastAttendance,
    attendanceLast30,
    workoutCompletions: member.workoutCompletions.length,
    dietCompletions: member.dietCompletions.length,
    progressUpdatesLast90,
    membershipExpired,
    pendingDue,
    renewalCount,
  };
}

const memberSignalInclude = {
  user: true,
  attendances: { orderBy: { date: "desc" as const } },
  workoutCompletions: true,
  dietCompletions: true,
  bodyMeasurements: true,
  dues: true,
  memberships: { orderBy: { endDate: "desc" as const } },
} as const;

export class RetentionService {
  /** Recompute + persist scores for every member in one gym. Returns count. */
  static async recomputeGym(gymId: string) {
    const members = await prisma.member.findMany({
      where: { gymId },
      include: memberSignalInclude,
    });

    const now = new Date();
    let updated = 0;
    for (const m of members) {
      const scores = computeMemberScores(buildSnapshot(m as unknown as MemberWithSignals, now));
      await prisma.member.update({
        where: { id: m.id },
        data: {
          retentionScore: scores.retentionScore,
          riskScore: scores.riskScore,
          riskLevel: scores.riskLevel,
          scoredAt: now,
        },
      });
      updated += 1;
    }
    return { gymId, updated };
  }

  /** Platform-wide recompute (nightly job). */
  static async recomputeAll() {
    const gyms = await prisma.gym.findMany({ select: { id: true } });
    let total = 0;
    for (const g of gyms) {
      const { updated } = await this.recomputeGym(g.id);
      total += updated;
    }
    return { gyms: gyms.length, membersScored: total };
  }

  /** Per-member risk list (uses stored scores; recompute on the fly if never scored). */
  static async getMemberRisk(user: AuthUser, opts: { level?: RiskLevel } = {}) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const members = await prisma.member.findMany({
      where: { gymId: user.gymId, ...(opts.level ? { riskLevel: opts.level } : {}) },
      include: { user: true },
      orderBy: [{ riskScore: "desc" }, { retentionScore: "asc" }],
    });

    return members.map((m) => ({
      memberId: m.id,
      name: m.user?.name ?? "Member",
      email: m.user?.email ?? null,
      trainerId: m.trainerId ?? null,
      retentionScore: m.retentionScore ?? null,
      riskScore: m.riskScore ?? null,
      riskLevel: m.riskLevel ?? null,
      scoredAt: m.scoredAt ?? null,
    }));
  }

  /** Members assigned to a specific trainer, ordered by risk (trainer dashboard). */
  static async getTrainerRisk(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const members = await prisma.member.findMany({
      where: { gymId: user.gymId, trainerId: user.id },
      include: { user: true },
      orderBy: [{ riskScore: "desc" }],
    });
    return members.map((m) => ({
      memberId: m.id,
      name: m.user?.name ?? "Member",
      retentionScore: m.retentionScore ?? null,
      riskScore: m.riskScore ?? null,
      riskLevel: m.riskLevel ?? null,
      scoredAt: m.scoredAt ?? null,
    }));
  }

  /** Gym retention/churn/CRM headline metrics. */
  static async getOverview(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const gymId = user.gymId;
    const now = new Date();

    const [members, memberships, leads, trials] = await Promise.all([
      prisma.member.findMany({ where: { gymId }, select: { riskLevel: true, riskScore: true, retentionScore: true } }),
      prisma.membership.findMany({ where: { gymId }, select: { endDate: true } }),
      prisma.lead.findMany({ where: { gymId }, select: { status: true } }),
      prisma.trialMembership.findMany({ where: { gymId }, select: { status: true } }),
    ]);

    const byLevel = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 } as Record<RiskLevel, number>;
    for (const m of members) if (m.riskLevel) byLevel[m.riskLevel] += 1;
    const atRisk = byLevel.HIGH + byLevel.CRITICAL;

    const activeMemberships = memberships.filter((m) => m.endDate >= now).length;
    const retentionRate = memberships.length
      ? Number(((activeMemberships / memberships.length) * 100).toFixed(2))
      : 0;
    const churnRate = members.length ? Number(((atRisk / members.length) * 100).toFixed(2)) : 0;

    const convertedLeads = leads.filter((l) => l.status === "CONVERTED").length;
    const leadConversionRate = leads.length
      ? Number(((convertedLeads / leads.length) * 100).toFixed(2))
      : 0;

    const convertedTrials = trials.filter((t) => t.status === "CONVERTED").length;
    const trialConversionRate = trials.length
      ? Number(((convertedTrials / trials.length) * 100).toFixed(2))
      : 0;

    const scored = members.filter((m) => m.retentionScore != null);
    const avgRetentionScore = scored.length
      ? Number((scored.reduce((s, m) => s + (m.retentionScore ?? 0), 0) / scored.length).toFixed(1))
      : 0;

    return {
      totalMembers: members.length,
      atRiskMembers: atRisk,
      riskBreakdown: byLevel,
      retentionRate,
      churnRate,
      avgRetentionScore,
      totalLeads: leads.length,
      convertedLeads,
      leadConversionRate,
      totalTrials: trials.length,
      convertedTrials,
      trialConversionRate,
    };
  }

  /** Build the pure scoring snapshot for one member (exposed for predictors). */
  static async snapshotForMember(gymId: string, memberId: string) {
    const m = await prisma.member.findFirst({
      where: { id: memberId, gymId },
      include: memberSignalInclude,
    });
    if (!m) throw new AppError("Member not found", 404);
    return buildSnapshot(m as unknown as MemberWithSignals);
  }

  /** Churn + renewal predictions for every member (AI-prep layer). */
  static async getPredictions(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const members = await prisma.member.findMany({
      where: { gymId: user.gymId },
      include: memberSignalInclude,
    });
    const now = new Date();
    return members
      .map((m) => {
        const snap = buildSnapshot(m as unknown as MemberWithSignals, now);
        return {
          memberId: m.id,
          name: m.user?.name ?? "Member",
          churn: ChurnPredictionService.predict(snap),
          renewal: RenewalPredictionService.predict(snap),
        };
      })
      .sort((a, b) => b.churn.predictionScore - a.churn.predictionScore);
  }

  /** Platform-wide retention/churn/conversion rollup (SUPER_ADMIN). */
  static async getPlatformOverview() {
    const now = new Date();
    const [members, memberships, leads, trials, gyms] = await Promise.all([
      prisma.member.findMany({ select: { gymId: true, riskLevel: true } }),
      prisma.membership.findMany({ select: { endDate: true } }),
      prisma.lead.findMany({ select: { gymId: true, status: true } }),
      prisma.trialMembership.findMany({ select: { status: true } }),
      prisma.gym.findMany({ select: { id: true, name: true } }),
    ]);

    const atRisk = members.filter((m) => m.riskLevel === "HIGH" || m.riskLevel === "CRITICAL").length;
    const activeMemberships = memberships.filter((m) => m.endDate >= now).length;
    const convertedLeads = leads.filter((l) => l.status === "CONVERTED").length;
    const convertedTrials = trials.filter((t) => t.status === "CONVERTED").length;

    // Per-gym lead conversion for a leaderboard.
    const perGym = gyms.map((g) => {
      const gymLeads = leads.filter((l) => l.gymId === g.id);
      const conv = gymLeads.filter((l) => l.status === "CONVERTED").length;
      const gymMembers = members.filter((m) => m.gymId === g.id);
      const gymAtRisk = gymMembers.filter((m) => m.riskLevel === "HIGH" || m.riskLevel === "CRITICAL").length;
      return {
        gymId: g.id,
        name: g.name,
        members: gymMembers.length,
        atRisk: gymAtRisk,
        leads: gymLeads.length,
        leadConversionRate: gymLeads.length ? Number(((conv / gymLeads.length) * 100).toFixed(1)) : 0,
      };
    });

    return {
      totalGyms: gyms.length,
      totalMembers: members.length,
      atRiskMembers: atRisk,
      retentionRate: memberships.length ? Number(((activeMemberships / memberships.length) * 100).toFixed(2)) : 0,
      churnRate: members.length ? Number(((atRisk / members.length) * 100).toFixed(2)) : 0,
      totalLeads: leads.length,
      leadConversionRate: leads.length ? Number(((convertedLeads / leads.length) * 100).toFixed(2)) : 0,
      totalTrials: trials.length,
      trialConversionRate: trials.length ? Number(((convertedTrials / trials.length) * 100).toFixed(2)) : 0,
      perGym: perGym.sort((a, b) => b.leadConversionRate - a.leadConversionRate),
    };
  }

  /** Detailed churn list with the live snapshot factors driving each score. */
  static async getChurn(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const members = await prisma.member.findMany({
      where: { gymId: user.gymId },
      include: memberSignalInclude,
    });
    const now = new Date();
    return members
      .map((m) => {
        const snap = buildSnapshot(m as unknown as MemberWithSignals, now);
        const scores = computeMemberScores(snap);
        return {
          memberId: m.id,
          name: m.user?.name ?? "Member",
          email: m.user?.email ?? null,
          ...scores,
          daysInactive: snap.daysSinceLastAttendance,
          membershipExpired: snap.membershipExpired,
          pendingDue: snap.pendingDue,
          renewalProbability: Math.max(0, 100 - scores.riskScore),
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore);
  }
}
