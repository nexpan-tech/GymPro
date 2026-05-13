"use strict";
// apps/backend/src/modules/analytics/analytics.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = exports.AnalyticsService = void 0;
const db_1 = require("../../config/db");
class AnalyticsService {
    /**
     * Dashboard overview
     */
    async getDashboard(gymId) {
        const totalMembers = await db_1.prisma.member.count({
            where: { gymId },
        });
        const activeMemberships = await db_1.prisma.membership.count({
            where: {
                gymId,
                endDate: {
                    gte: new Date(),
                },
            },
        });
        const revenueResult = await db_1.prisma.membership.aggregate({
            where: { gymId },
            _sum: {
                amount: true,
            },
        });
        const totalRevenue = revenueResult._sum?.amount ?? 0;
        const usersByRoleRaw = await db_1.prisma.user.groupBy({
            by: ["role"],
            where: {
                gymId,
            },
            _count: {
                id: true,
            },
        });
        const usersByRole = usersByRoleRaw.map((item) => ({
            role: item.role,
            count: item._count.id,
        }));
        return {
            totalMembers,
            activeMemberships,
            totalRevenue,
            usersByRole,
        };
    }
    /**
     * Revenue chart grouped by month
     */
    async getRevenueChart(gymId) {
        const memberships = await db_1.prisma.membership.findMany({
            where: { gymId },
            select: {
                amount: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "asc",
            },
        });
        const monthlyMap = new Map();
        for (const membership of memberships) {
            const month = membership.createdAt.toISOString().slice(0, 7); // YYYY-MM
            monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + membership.amount);
        }
        return Array.from(monthlyMap.entries()).map(([month, revenue]) => ({
            month,
            revenue,
        }));
    }
    /**
     * Membership distribution by plan
     */
    async getMembershipDistribution(gymId) {
        const grouped = await db_1.prisma.membership.groupBy({
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
    async getGymOverview(gymId) {
        const gym = await db_1.prisma.gym.findUnique({
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
        const totalMembers = await db_1.prisma.member.count({
            where: {
                gymId,
            },
        });
        const activeMemberships = await db_1.prisma.membership.count({
            where: {
                gymId,
                endDate: {
                    gte: new Date(),
                },
            },
        });
        const revenueResult = await db_1.prisma.membership.aggregate({
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
    async getMembershipStats(gymId) {
        return this.getMembershipDistribution(gymId);
    }
    /**
     * Revenue stats alias
     */
    async getRevenueStats(gymId) {
        return this.getRevenueChart(gymId);
    }
    /**
     * User role stats
     */
    async getUserStats(gymId) {
        const grouped = await db_1.prisma.user.groupBy({
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
    async getRecentMemberships(gymId) {
        const memberships = await db_1.prisma.membership.findMany({
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
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();
