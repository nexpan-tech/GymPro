import { prisma } from "../../config/db";
import { BillingAnalyticsService } from "../billing/billing.analytics.service";
import { RetentionService } from "../retention/retention.service";
import { GamificationService } from "../gamification/gamification.service";
import { RevenueSummaryService } from "../super-admin/revenue.service";

/**
 * Stage 10 — unified ENTERPRISE analytics aggregator (SUPER_ADMIN, platform-wide).
 * Pure orchestration: it CALLS the existing Stage 6/7/8 analytics services and a
 * lightweight communication rollup. No metric is recomputed here.
 */
export class EnterpriseService {
  static async overview() {
    const now = new Date();
    const [billing, retention, engagement, revSummary, revenueTrend, comms, counts] = await Promise.all([
      BillingAnalyticsService.overview(), // activeGyms/trialGyms/churnRate (subscription-based)
      RetentionService.getPlatformOverview(), // retention/churn/lead+trial conversion/perGym
      GamificationService.getPlatformEngagement(), // challenges/redemptions/referrals/points
      RevenueSummaryService.summary(), // SSOT — per-active-member MRR/ARR
      RevenueSummaryService.revenueTrend(6), // SSOT — paid SaaS invoice revenue/month
      this.communicationRollup(),
      this.platformCounts(now),
    ]);

    return {
      revenue: {
        // Single source of truth: same MRR/ARR the Dashboard + Billing show.
        mrr: revSummary.mrr,
        arr: revSummary.arr,
        churnRate: billing.churnRate,
        revenueTrend,
      },
      members: {
        activeGyms: billing.activeGyms,
        trialGyms: billing.trialGyms,
        totalGyms: retention.totalGyms,
        totalMembers: retention.totalMembers,
        activeMembers: counts.activeMembers,
      },
      retention: {
        retentionRate: retention.retentionRate,
        churnRate: retention.churnRate,
        atRiskMembers: retention.atRiskMembers,
        leadConversionRate: retention.leadConversionRate,
        trialConversionRate: retention.trialConversionRate,
      },
      engagement: {
        challengeParticipations: engagement.totalChallengeParticipations,
        rewardRedemptions: engagement.totalRedemptions,
        referrals: engagement.totalReferrals,
        referralConversionRate: engagement.referralConversionRate,
        avgLevel: engagement.avgLevel,
        totalPoints: engagement.totalPoints,
      },
      communication: comms,
      topGyms: retention.perGym.slice(0, 10),
    };
  }

  /** Platform-wide communication delivery rollup (Stage 9 DeliveryLog). */
  private static async communicationRollup() {
    const [logs, announcements] = await Promise.all([
      prisma.deliveryLog.findMany({ select: { status: true } }),
      prisma.announcement.count({ where: { status: "SENT" } }),
    ]);
    let sent = 0;
    let failed = 0;
    for (const l of logs) {
      if (l.status === "FAILED") failed += 1;
      else if (l.status !== "SKIPPED") sent += 1;
    }
    return { messagesSent: sent, messagesFailed: failed, announcementsSent: announcements };
  }

  private static async platformCounts(now: Date) {
    const activeMembers = await prisma.membership.findMany({
      where: { endDate: { gte: now } },
      select: { memberId: true },
      distinct: ["memberId"],
    });
    return { activeMembers: activeMembers.length };
  }
}
