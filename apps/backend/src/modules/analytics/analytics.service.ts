// apps/backend/src/modules/analytics/analytics.service.ts

import { prisma } from "../../config/db";

export class AnalyticsService {
  /**
   * Dashboard overview
   */
  async getDashboard(gymId: string) {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalMembers,
      activeMembers,
      totalMemberships,
      activeMemberships,
      usersByRoleRaw,
      todayAttendance,
      monthlyPaid,
      membershipRevenue,
      openDues,
    ] = await Promise.all([
      // MEMBERS = the Member table only. Trainers/receptionists/admins are User
      // rows (role-based) and are NEVER counted as members.
      prisma.member.count({ where: { gymId } }),
      prisma.member.count({ where: { gymId, status: "ACTIVE" } }),
      prisma.membership.count({ where: { gymId } }),
      prisma.membership.count({ where: { gymId, status: "ACTIVE", endDate: { gte: now } } }),
      prisma.user.groupBy({ by: ["role"], where: { gymId }, _count: { id: true } }),
      prisma.attendance.count({ where: { gymId, date: { gte: todayStart } } }),
      prisma.payment.aggregate({ where: { gymId, status: "PAID", paidAt: { gte: monthStart } }, _sum: { amount: true } }),
      prisma.membership.aggregate({ where: { gymId }, _sum: { amount: true } }),
      prisma.due.findMany({ where: { gymId, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } }, select: { amount: true, paidAmount: true } }),
    ]);

    const roleCount = (r: string) => usersByRoleRaw.find((u) => u.role === r)?._count.id ?? 0;
    const trainers = roleCount("TRAINER");
    const receptionists = roleCount("RECEPTIONIST");
    const admins = roleCount("ADMIN");
    const pendingDues = openDues.reduce((s, d) => s + Math.max(0, d.amount - (d.paidAmount ?? 0)), 0);

    const usersByRole = usersByRoleRaw.map((item) => ({ role: item.role, count: item._count.id }));

    return {
      // ── Members (Member role only) ──
      totalMembers,
      activeMembers,
      // ── Staff breakdown (Users, by role — separate from members) ──
      trainers,
      receptionists,
      admins,
      staff: trainers + receptionists + admins,
      // ── Memberships ──
      totalMemberships,
      activeMemberships,
      // ── Money + activity ──
      monthlyRevenue: monthlyPaid._sum?.amount ?? 0,
      totalRevenue: membershipRevenue._sum?.amount ?? 0,
      todayAttendance,
      pendingDues: Math.round((pendingDues + Number.EPSILON) * 100) / 100,
      usersByRole,
    };
  }

  /**
   * Revenue chart grouped by month
   */
  async getRevenueChart(gymId: string) {
    const memberships = await prisma.membership.findMany({
      where: { gymId },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const monthlyMap = new Map<string, number>();

    for (const membership of memberships) {
      const month = membership.createdAt.toISOString().slice(0, 7); // YYYY-MM
      monthlyMap.set(
        month,
        (monthlyMap.get(month) ?? 0) + membership.amount
      );
    }

    return Array.from(monthlyMap.entries()).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  }

  /**
   * Membership distribution by plan
   */
  async getMembershipDistribution(gymId: string) {
    const grouped = await prisma.membership.groupBy({
      by: ["plan"],
      where: {
        gymId,
      },
      _count: true,
      _sum: {
        amount: true,
      },
    });

    return grouped.map((item) => ({
      plan: item.plan,
      count: item._count,
      revenue: item._sum?.amount ?? 0,
    }));
  }

  /**
   * Gym overview
   */
  async getGymOverview(gymId: string) {
    const gym = await prisma.gym.findUnique({
      where: {
        id: gymId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        logo: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!gym) {
      return null;
    }

    const totalMembers = await prisma.member.count({
      where: {
        gymId,
      },
    });

    const activeMemberships = await prisma.membership.count({
      where: {
        gymId,
        endDate: {
          gte: new Date(),
        },
      },
    });

    const revenueResult = await prisma.membership.aggregate({
      where: {
        gymId,
      },
      _sum: {
        amount: true,
      },
    });

    const totalRevenue = revenueResult._sum?.amount ?? 0;

    return {
      ...gym,
      totalMembers,
      activeMemberships,
      totalRevenue,
    };
  }

  /**
   * Membership stats alias
   */
  async getMembershipStats(gymId: string) {
    return this.getMembershipDistribution(gymId);
  }

  /**
   * Revenue stats alias
   */
  async getRevenueStats(gymId: string) {
    return this.getRevenueChart(gymId);
  }

  /**
   * User role stats
   */
  async getUserStats(gymId: string) {
    const grouped = await prisma.user.groupBy({
      by: ["role"],
      where: {
        gymId,
      },
      _count: true,
    });

    return grouped.map((item) => ({
      role: item.role,
      count: item._count,
    }));
  }

  /**
   * Recent memberships
   */
  async getRecentMemberships(gymId: string) {
    const memberships = await prisma.membership.findMany({
      where: {
        gymId,
      },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        member: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return memberships.map((membership) => ({
      id: membership.id,
      memberId: membership.memberId,
      memberName: membership.member.user.name,
      memberEmail: membership.member.user.email,
      plan: membership.plan,
      amount: membership.amount,
      paymentStatus: membership.paymentStatus,
      startDate: membership.startDate,
      endDate: membership.endDate,
      createdAt: membership.createdAt,
    }));
  }
}

export const analyticsService = new AnalyticsService();