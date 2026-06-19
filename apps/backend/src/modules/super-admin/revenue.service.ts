import { prisma } from "../../config/db";

/**
 * RevenueSummaryService — the SINGLE source of truth for platform revenue.
 * Every surface (Dashboard, Billing, Enterprise Analytics) must read MRR/ARR
 * and collection figures from here so the numbers can never diverge.
 *
 *   MRR = Σ(active members × gym.pricePerActiveMember)  over active gyms
 *   ARR = MRR × 12
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

  /** Per-active-member MRR/ARR + invoice collection breakdown. */
  static async summary() {
    const [counts, gyms, invoices] = await Promise.all([
      this.activeMemberCounts(),
      prisma.gym.findMany({ where: { isActive: true }, select: { id: true, pricePerActiveMember: true } }),
      prisma.saaSInvoice.findMany({ select: { status: true, totalAmount: true, dueDate: true } }),
    ]);

    const mrr = round(
      gyms.reduce((s, g) => s + (counts.get(g.id) ?? 0) * (g.pricePerActiveMember ?? 0), 0),
    );

    const now = new Date();
    let paid = 0, pending = 0, overdue = 0;
    for (const i of invoices) {
      if (i.status === "PAID") paid += i.totalAmount;
      else if (i.status === "CANCELLED") continue;
      else if (i.dueDate < now) overdue += i.totalAmount;
      else pending += i.totalAmount;
    }
    return { mrr, arr: round(mrr * 12), paid: round(paid), pending: round(pending), overdue: round(overdue) };
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
