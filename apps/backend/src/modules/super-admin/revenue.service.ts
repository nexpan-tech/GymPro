import { prisma } from "../../config/db";
import { LicenseService } from "../license/license.service";

/**
 * RevenueSummaryService — the SINGLE source of truth for platform revenue.
 * Every surface (Dashboard, Billing, Enterprise Analytics) reads MRR/ARR and
 * collection figures from here so the numbers can never diverge.
 *
 * LICENSE-BASED (2026 model): MRR = Σ monthly-normalised plan price of every
 * ACTIVE license (yearly ÷ 12). The legacy per-active-member formula is GONE —
 * this delegates to LicenseService.billingSummary() so revenue is always the
 * flat license fee, never member-count × price.
 */

function round(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export class RevenueSummaryService {
  /** Active member counts per gym (status = ACTIVE only). */
  static async activeMemberCounts(): Promise<Map<string, number>> {
    const rows = await prisma.member.groupBy({
      by: ["gymId"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
    });
    return new Map(rows.map((r) => [r.gymId, r._count._all]));
  }

  /**
   * License-based MRR/ARR + invoice collection + license counts. Delegates to
   * LicenseService.billingSummary() (the flat-license model). Returns the
   * full license metric set; legacy consumers reading {mrr,arr,paid,pending,
   * overdue} continue to work (those keys are a subset).
   */
  static async summary() {
    return LicenseService.billingSummary();
  }

  /** Paid SaaS revenue per month for the last `months` months (oldest→newest). */
  static async revenueTrend(months = 6) {
    const buckets: { month: string; revenue: number }[] = [];
    const idx = new Map<string, number>();
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      idx.set(monthKey(d), buckets.length);
      buckets.push({ month: monthKey(d), revenue: 0 });
    }
    const paid = await prisma.saaSInvoice.findMany({
      where: { status: "PAID" },
      select: { totalAmount: true, paidAt: true },
    });
    for (const inv of paid) {
      if (!inv.paidAt) continue;
      const i = idx.get(monthKey(inv.paidAt));
      if (i !== undefined) buckets[i].revenue = round(buckets[i].revenue + inv.totalAmount);
    }
    return buckets;
  }
}
