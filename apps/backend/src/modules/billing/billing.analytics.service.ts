import { prisma } from "../../config/db";

// Platform-wide SaaS revenue analytics (GymPro → Gyms). SUPER_ADMIN only — no
// gym scoping, this is the whole platform.

function round(n: number) {
  return Math.round(n * 100) / 100;
}

/** Monthly-equivalent price for a subscription (YEARLY → /12). */
function monthlyValue(price: number, interval: string) {
  return interval === "YEARLY" ? price / 12 : price;
}

export class BillingAnalyticsService {
  static async overview() {
    const [mrr, activeGyms, trialGyms, churn] = await Promise.all([
      this.mrr(),
      prisma.gymSubscription.count({ where: { status: "ACTIVE" } }),
      prisma.gymSubscription.count({ where: { status: "TRIALING" } }),
      this.churn(),
    ]);
    return {
      mrr,
      arr: round(mrr * 12),
      activeGyms,
      trialGyms,
      churnRate: churn.churnRate,
      cancelledLast30: churn.cancelledLast30,
    };
  }

  static async mrr() {
    const subs = await prisma.gymSubscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true },
    });
    const total = subs.reduce(
      (sum, s) => sum + monthlyValue(s.plan.price, s.plan.interval),
      0,
    );
    return round(total);
  }

  static async arr() {
    return round((await this.mrr()) * 12);
  }

  static async churn() {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const [active, cancelledLast30] = await Promise.all([
      prisma.gymSubscription.count({ where: { status: "ACTIVE" } }),
      prisma.gymSubscription.count({
        where: { status: "CANCELLED", updatedAt: { gte: since } },
      }),
    ]);
    const denom = active + cancelledLast30;
    return {
      cancelledLast30,
      churnRate: denom > 0 ? round((cancelledLast30 / denom) * 100) : 0,
    };
  }

  /** Paid SaaS invoice revenue per month for the last `months` months. */
  static async revenueTrend(months = 6) {
    const start = new Date();
    start.setMonth(start.getMonth() - (months - 1));
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const invoices = await prisma.saaSInvoice.findMany({
      where: { status: "PAID", paidAt: { gte: start } },
      select: { totalAmount: true, paidAt: true },
    });

    const buckets = new Map<string, number>();
    for (let i = 0; i < months; i++) {
      const d = new Date(start);
      d.setMonth(d.getMonth() + i);
      buckets.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
    }
    for (const inv of invoices) {
      if (!inv.paidAt) continue;
      const key = `${inv.paidAt.getFullYear()}-${String(inv.paidAt.getMonth() + 1).padStart(2, "0")}`;
      if (buckets.has(key)) buckets.set(key, round(buckets.get(key)! + inv.totalAmount));
    }
    return Array.from(buckets.entries()).map(([month, revenue]) => ({ month, revenue }));
  }
}
