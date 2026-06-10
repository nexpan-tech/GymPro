import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import { monthlySeries, projectNext } from "./trend";

type AuthUser = { id: string; role: string; gymId: string | null };

export interface Insight {
  type:
    | "CHURN_RISK"
    | "RENEWAL_LIKELY"
    | "HIGH_VALUE"
    | "HIGH_RISK"
    | "GROWTH_TREND"
    | "REVENUE_TREND";
  title: string;
  description: string;
  severity: "info" | "positive" | "warning";
  confidence: number;
  metric?: number;
}

/**
 * Stage 10 — predictive insight engine. Reuses the persisted Stage 7 retention
 * scores (riskLevel/retentionScore) + Stage 6 payments + memberships + Stage 8
 * XP. No churn recomputation, no external AI.
 */
export class InsightEngine {
  static async forGym(user: AuthUser): Promise<Insight[]> {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const gymId = user.gymId;
    const now = new Date();

    const [members, memberships, payments, topXp] = await Promise.all([
      prisma.member.findMany({ where: { gymId }, select: { id: true, riskLevel: true, retentionScore: true, createdAt: true } }),
      prisma.membership.findMany({ where: { gymId }, select: { endDate: true, memberId: true } }),
      prisma.payment.findMany({ where: { gymId, status: "PAID" }, select: { amount: true, paidAt: true, createdAt: true } }),
      prisma.memberXP.findMany({ where: { gymId }, orderBy: { xp: "desc" }, take: 100, select: { xp: true, memberId: true } }),
    ]);

    const activeMemberIds = new Set(memberships.filter((m) => m.endDate >= now).map((m) => m.memberId));
    const churnRisk = members.filter((m) => m.riskLevel === "HIGH" || m.riskLevel === "CRITICAL");
    const critical = members.filter((m) => m.riskLevel === "CRITICAL");
    const renewalLikely = members.filter((m) => m.riskLevel === "LOW" && activeMemberIds.has(m.id));
    // High value = top XP earners who are also active.
    const highValue = topXp.filter((x) => activeMemberIds.has(x.memberId) && x.xp >= 200);

    const growth = projectNext(monthlySeries(members.map((m) => ({ date: m.createdAt })), 6, now));
    const revenue = projectNext(monthlySeries(payments.map((p) => ({ date: p.paidAt ?? p.createdAt, value: Number(p.amount) })), 6, now));

    const insights: Insight[] = [];

    insights.push({
      type: "CHURN_RISK",
      title: `${churnRisk.length} member${churnRisk.length === 1 ? "" : "s"} likely to churn`,
      description: churnRisk.length ? "These members show declining engagement — a personal check-in or offer can win them back." : "No members are currently flagged as high churn risk.",
      severity: churnRisk.length ? "warning" : "positive",
      confidence: 0.7,
      metric: churnRisk.length,
    });

    insights.push({
      type: "RENEWAL_LIKELY",
      title: `${renewalLikely.length} member${renewalLikely.length === 1 ? "" : "s"} likely to renew`,
      description: "Engaged, low-risk members with active memberships — great candidates for upsells or referrals.",
      severity: "positive",
      confidence: 0.7,
      metric: renewalLikely.length,
    });

    insights.push({
      type: "HIGH_VALUE",
      title: `${highValue.length} high-value member${highValue.length === 1 ? "" : "s"}`,
      description: "Top point earners who are active — your community champions. Consider VIP perks.",
      severity: "positive",
      confidence: 0.65,
      metric: highValue.length,
    });

    insights.push({
      type: "HIGH_RISK",
      title: `${critical.length} high-risk member${critical.length === 1 ? "" : "s"}`,
      description: critical.length ? "Critical churn risk — prioritise outreach this week." : "No critical-risk members right now.",
      severity: critical.length ? "warning" : "positive",
      confidence: 0.75,
      metric: critical.length,
    });

    insights.push({
      type: "GROWTH_TREND",
      title: `Gym growth is trending ${growth.direction}`,
      description: `Projected ~${growth.projected} new members next month (${growth.changePercent >= 0 ? "+" : ""}${growth.changePercent}%).`,
      severity: growth.direction === "down" ? "warning" : "positive",
      confidence: growth.confidence,
      metric: growth.projected,
    });

    insights.push({
      type: "REVENUE_TREND",
      title: `Revenue is trending ${revenue.direction}`,
      description: `Projected ~₹${revenue.projected} next month (${revenue.changePercent >= 0 ? "+" : ""}${revenue.changePercent}%).`,
      severity: revenue.direction === "down" ? "warning" : "positive",
      confidence: revenue.confidence,
      metric: revenue.projected,
    });

    return insights;
  }
}
