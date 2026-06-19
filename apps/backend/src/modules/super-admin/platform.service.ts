import { prisma } from "../../config/db";
import { SaaSBillingService, computeBill } from "./saas-billing.service";
import { notificationQueue } from "../../queues/notification.queue";
import { smsQueue } from "../../queues/sms.queue";
import { deadLetterQueue } from "../../queues/dlq";
import { getQueueStats } from "../../queues/queueMonitor";

/**
 * Platform-wide operational data for the SUPER_ADMIN console. Every number is
 * derived from real DB relations — there is no mock/seed data here. Empty
 * platforms return zeros + empty arrays so the UI can show real empty states.
 */

function round(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Last `n` month keys (oldest → newest, ending current month). */
function monthBuckets(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(monthKey(d));
  }
  return out;
}

async function activeMemberCounts(): Promise<Map<string, number>> {
  const rows = await prisma.member.groupBy({
    by: ["gymId"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.gymId, r._count._all]));
}

export class PlatformService {
  /** The full real-data Super Admin dashboard payload. */
  static async dashboard() {
    const [
      totalGyms, activeGyms, totalBranches, totalMembers, activeMembers,
      totalTrainers, totalGymAdmins, counts, revenue, gyms, recentInvoices,
      gymsCreated, membersCreated, paidInvoices,
    ] = await Promise.all([
      prisma.gym.count(),
      prisma.gym.count({ where: { isActive: true } }),
      prisma.branch.count(),
      prisma.member.count(),
      prisma.member.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { role: "TRAINER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      activeMemberCounts(),
      SaaSBillingService.revenueSummary(),
      prisma.gym.findMany({ select: { id: true, name: true, isActive: true, pricePerActiveMember: true, gstPercent: true, createdAt: true } }),
      prisma.saaSInvoice.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { gym: { select: { name: true } } },
      }),
      prisma.gym.findMany({ select: { createdAt: true } }),
      prisma.member.findMany({ select: { createdAt: true } }),
      prisma.saaSInvoice.findMany({ where: { status: "PAID" }, select: { gymId: true, totalAmount: true, paidAt: true } }),
    ]);

    // ── Growth trends (last 6 months) ──────────────────────────────────────
    const buckets = monthBuckets(6);
    const gymTrend = buckets.map((m) => ({ month: m, count: 0 }));
    const memberTrend = buckets.map((m) => ({ month: m, count: 0 }));
    const revenueTrend = buckets.map((m) => ({ month: m, revenue: 0 }));
    const idx = new Map(buckets.map((m, i) => [m, i]));

    for (const g of gymsCreated) {
      const i = idx.get(monthKey(g.createdAt));
      if (i !== undefined) gymTrend[i].count++;
    }
    for (const m of membersCreated) {
      const i = idx.get(monthKey(m.createdAt));
      if (i !== undefined) memberTrend[i].count++;
    }
    for (const inv of paidInvoices) {
      if (!inv.paidAt) continue;
      const i = idx.get(monthKey(inv.paidAt));
      if (i !== undefined) revenueTrend[i].revenue = round(revenueTrend[i].revenue + inv.totalAmount);
    }

    // ── Top gyms ───────────────────────────────────────────────────────────
    const gymName = new Map(gyms.map((g) => [g.id, g.name]));
    const topByMembers = [...gyms]
      .map((g) => ({ gymId: g.id, name: g.name, activeMembers: counts.get(g.id) ?? 0 }))
      .sort((a, b) => b.activeMembers - a.activeMembers)
      .slice(0, 5);

    const revByGym = new Map<string, number>();
    for (const inv of paidInvoices) revByGym.set(inv.gymId, (revByGym.get(inv.gymId) ?? 0) + inv.totalAmount);
    const topByRevenue = [...revByGym.entries()]
      .map(([gymId, rev]) => ({ gymId, name: gymName.get(gymId) ?? "—", revenue: round(rev) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const recentGyms = [...gyms]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map((g) => ({
        gymId: g.id,
        name: g.name,
        isActive: g.isActive,
        activeMembers: counts.get(g.id) ?? 0,
        monthlyAmount: computeBill(counts.get(g.id) ?? 0, g.pricePerActiveMember ?? 0, g.gstPercent).total,
        createdAt: g.createdAt,
      }));

    const recentBilling = recentInvoices.map((i) => ({
      id: i.id,
      gymName: i.gym?.name ?? "—",
      invoiceNumber: i.invoiceNumber,
      billingMonth: i.billingMonth,
      totalAmount: i.totalAmount,
      status: i.status,
      createdAt: i.createdAt,
    }));

    return {
      kpis: {
        totalGyms,
        activeGyms,
        inactiveGyms: totalGyms - activeGyms,
        totalBranches,
        totalMembers,
        activeMembers,
        totalTrainers,
        totalGymAdmins,
        mrr: revenue.mrr,
        arr: revenue.arr,
        paidSaaS: revenue.paid,
        pendingSaaS: revenue.pending,
        overdueSaaS: revenue.overdue,
        monthlyRevenue: revenueTrend[revenueTrend.length - 1]?.revenue ?? 0,
      },
      gymTrend,
      memberTrend,
      revenueTrend,
      topGymsByActiveMembers: topByMembers,
      topGymsBySaaSRevenue: topByRevenue,
      recentGyms,
      recentBilling,
    };
  }

  /** Every gym with REAL branch / member / staff counts + per-member pricing. */
  static async gyms() {
    const [gyms, counts, branchCounts, activeMemberByGym, staffByGym] = await Promise.all([
      prisma.gym.findMany({ orderBy: { createdAt: "desc" } }),
      activeMemberCounts(),
      prisma.branch.groupBy({ by: ["gymId"], _count: { _all: true } }),
      prisma.member.groupBy({ by: ["gymId"], _count: { _all: true } }),
      prisma.user.groupBy({ by: ["gymId", "role"], _count: { _all: true } }),
    ]);

    const branchMap = new Map(branchCounts.map((b) => [b.gymId, b._count._all]));
    const totalMemberMap = new Map(activeMemberByGym.map((m) => [m.gymId, m._count._all]));
    const trainerMap = new Map<string, number>();
    const adminMap = new Map<string, number>();
    for (const s of staffByGym) {
      if (!s.gymId) continue;
      if (s.role === "TRAINER") trainerMap.set(s.gymId, s._count._all);
      if (s.role === "ADMIN") adminMap.set(s.gymId, s._count._all);
    }

    return gyms.map((g) => {
      const activeMembers = counts.get(g.id) ?? 0;
      const { total: monthlyAmount } = computeBill(activeMembers, g.pricePerActiveMember ?? 0, g.gstPercent);
      return {
        id: g.id,
        name: g.name,
        email: g.email,
        isActive: g.isActive,
        subscriptionStatus: g.isActive ? "ACTIVE" : "SUSPENDED",
        branchCount: branchMap.get(g.id) ?? 0,
        activeMemberCount: activeMembers,
        totalMemberCount: totalMemberMap.get(g.id) ?? 0,
        trainerCount: trainerMap.get(g.id) ?? 0,
        gymAdminCount: adminMap.get(g.id) ?? 0,
        pricePerActiveMember: g.pricePerActiveMember ?? 0,
        gstPercent: g.gstPercent,
        monthlyAmount,
        createdAt: g.createdAt,
      };
    });
  }

  // ── Operations: metrics / monitoring / queue (real, resilient) ───────────

  private static async dbOk(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /** Best-effort BullMQ/Redis queue stats; degrades safely if Redis is down. */
  private static async queueStats() {
    try {
      const queues = [
        { name: "notifications", q: notificationQueue },
        { name: "sms", q: smsQueue },
        { name: "dead-letter", q: deadLetterQueue },
      ];
      const stats = await Promise.all(
        queues.map(async ({ name, q }) => ({ ...(await getQueueStats(q as any)), name })),
      );
      return { available: true, queues: stats };
    } catch (err) {
      return { available: false, reason: "Queue/Redis not reachable", queues: [] as any[], error: String(err).slice(0, 200) };
    }
  }

  static async metrics() {
    const mem = process.memoryUsage();
    const [dbOk, queue, activeGyms, activeUsers] = await Promise.all([
      this.dbOk(),
      this.queueStats(),
      prisma.gym.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
    ]);
    return {
      api: { status: "ok", uptimeSeconds: Math.round(process.uptime()), nodeVersion: process.version, env: process.env.NODE_ENV ?? "development" },
      database: { status: dbOk ? "connected" : "down" },
      redis: { status: queue.available ? "connected" : "unavailable" },
      queue: { status: queue.available ? "running" : "unavailable", queues: queue.queues },
      memory: {
        rssMb: round(mem.rss / 1024 / 1024),
        heapUsedMb: round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: round(mem.heapTotal / 1024 / 1024),
      },
      platform: { activeGyms, activeUsers },
      timestamp: new Date().toISOString(),
    };
  }

  static async monitoring() {
    const [dbOk, queue] = await Promise.all([this.dbOk(), this.queueStats()]);
    const failedJobs = queue.available
      ? queue.queues.reduce((s: number, q: any) => s + (q.failed ?? 0), 0)
      : null;
    return {
      services: {
        backend: { status: "healthy", uptimeSeconds: Math.round(process.uptime()) },
        database: { status: dbOk ? "healthy" : "down" },
        redis: { status: queue.available ? "healthy" : "unavailable" },
        queue: { status: queue.available ? "healthy" : "unavailable" },
      },
      workers: { status: queue.available ? "active" : "unknown", failedJobs },
      environment: process.env.NODE_ENV ?? "development",
      version: process.env.npm_package_version ?? process.env.APP_VERSION ?? "unknown",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  static async queue() {
    return this.queueStats();
  }
}
