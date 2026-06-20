import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import { CacheService } from "../../cache/cache.service";
import { LicenseService } from "../license/license.service";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

export class BranchService {
  static async create(user: AuthUser, data: any) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    // SaaS license enforcement: block when the gym is at its branch cap.
    await LicenseService.assertBranchCapacity(user.gymId);

    const branch = await prisma.branch.create({
      data: {
        gymId: user.gymId,
        name: data.name,
        code: data.code,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
      },
    });

    CacheService.clear();
    return branch;
  }

  static async getAll(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.branch.findMany({
      where: { gymId: user.gymId },
      include: {
        users: true,
        members: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getById(user: AuthUser, id: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const branch = await prisma.branch.findFirst({
      where: { id, gymId: user.gymId },
      include: {
        users: true,
        members: true,
      },
    });

    if (!branch) throw new AppError("Branch not found", 404);

    return branch;
  }

  static async update(user: AuthUser, id: string, data: any) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const branch = await prisma.branch.findFirst({
      where: { id, gymId: user.gymId },
    });

    if (!branch) throw new AppError("Branch not found", 404);

    const updated = await prisma.branch.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        isActive: data.isActive,
      },
    });

    CacheService.clear();
    return updated;
  }

  static async assignUser(user: AuthUser, branchId: string, targetUserId: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const branch = await prisma.branch.findFirst({
      where: { id: branchId, gymId: user.gymId },
    });

    if (!branch) throw new AppError("Branch not found", 404);

    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, gymId: user.gymId },
    });

    if (!targetUser) throw new AppError("User not found in this gym", 404);

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { branchId },
    });

    CacheService.clear();
    return updated;
  }

  static async assignMember(user: AuthUser, branchId: string, memberId: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const branch = await prisma.branch.findFirst({
      where: { id: branchId, gymId: user.gymId },
    });

    if (!branch) throw new AppError("Branch not found", 404);

    const member = await prisma.member.findFirst({
      where: { id: memberId, gymId: user.gymId },
    });

    if (!member) throw new AppError("Member not found in this gym", 404);

    const updated = await prisma.member.update({
      where: { id: memberId },
      data: { branchId },
      include: {
        user: true,
        branch: true,
      },
    });

    CacheService.clear();
    return updated;
  }

  static async analyticsOverview(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const cacheKey = `branch:analytics:overview:${user.gymId}`;
    const cached = CacheService.get(cacheKey);
    if (cached) return cached;

    const branches = await prisma.branch.findMany({
      where: { gymId: user.gymId },
      include: {
        users: true,
        members: {
          include: {
            payments: true,
            attendances: true,
            memberships: true,
          },
        },
      },
    });

    const result = branches.map((branch) => {
      const revenue = branch.members.reduce(
        (sum, member) =>
          sum +
          member.payments.reduce(
            (paymentSum, payment) => paymentSum + Number(payment.amount),
            0
          ),
        0
      );

      const attendance = branch.members.reduce(
        (sum, member) => sum + member.attendances.length,
        0
      );

      const activeMemberships = branch.members.reduce(
        (sum, member) =>
          sum +
          member.memberships.filter((m) => m.endDate >= new Date()).length,
        0
      );

      return {
        branchId: branch.id,
        branchName: branch.name,
        code: branch.code,
        staffCount: branch.users.length,
        memberCount: branch.members.length,
        activeMemberships,
        totalAttendance: attendance,
        totalRevenue: revenue,
      };
    });

    CacheService.set(cacheKey, result, 600);
    return result;
  }

  static async comparisonAnalytics(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const cacheKey = `branch:analytics:comparison:${user.gymId}`;
    const cached = CacheService.get(cacheKey);
    if (cached) return cached;

    const overview = await this.analyticsOverview(user);

    const result = (overview as any[])
      .map((branch) => ({
        ...branch,
        performanceScore:
          branch.memberCount * 20 +
          branch.activeMemberships * 30 +
          branch.totalAttendance * 5 +
          branch.totalRevenue * 0.01,
      }))
      .sort((a, b) => b.performanceScore - a.performanceScore);

    CacheService.set(cacheKey, result, 600);
    return result;
  }

  static async branchAnalytics(user: AuthUser, branchId: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const cacheKey = `branch:analytics:${user.gymId}:${branchId}`;
    const cached = CacheService.get(cacheKey);
    if (cached) return cached;

    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        gymId: user.gymId,
      },
      include: {
        users: true,
        members: {
          include: {
            user: true,
            payments: true,
            attendances: true,
            memberships: true,
          },
        },
      },
    });

    if (!branch) throw new AppError("Branch not found", 404);

    const revenue = branch.members.reduce(
      (sum, member) =>
        sum +
        member.payments.reduce(
          (paymentSum, payment) => paymentSum + Number(payment.amount),
          0
        ),
      0
    );

    const attendance = branch.members.reduce(
      (sum, member) => sum + member.attendances.length,
      0
    );

    const result = {
      branchId: branch.id,
      branchName: branch.name,
      code: branch.code,
      staffCount: branch.users.length,
      memberCount: branch.members.length,
      totalRevenue: revenue,
      totalAttendance: attendance,
      members: branch.members.map((member) => ({
        memberId: member.id,
        name: member.user.name,
        email: member.user.email,
        attendanceCount: member.attendances.length,
        revenue: member.payments.reduce(
          (sum, payment) => sum + Number(payment.amount),
          0
        ),
      })),
    };

    CacheService.set(cacheKey, result, 600);
    return result;
  }

  static async assignRegionalManager(
    user: AuthUser,
    branchId: string,
    managerId: string
  ) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const branch = await prisma.branch.findFirst({
      where: { id: branchId, gymId: user.gymId },
    });

    if (!branch) throw new AppError("Branch not found", 404);

    const manager = await prisma.user.findFirst({
      where: {
        id: managerId,
        gymId: user.gymId,
        role: "REGIONAL_MANAGER",
      },
    });

    if (!manager) throw new AppError("Regional manager not found", 404);

    return prisma.regionalManagerBranch.upsert({
      where: {
        managerId_branchId: {
          managerId,
          branchId,
        },
      },
      update: {},
      create: {
        gymId: user.gymId,
        managerId,
        branchId,
      },
      include: {
        manager: true,
        branch: true,
      },
    });
  }

  static async myBranches(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    if (user.role === "REGIONAL_MANAGER") {
      return prisma.regionalManagerBranch.findMany({
        where: {
          gymId: user.gymId,
          managerId: user.id,
        },
        include: {
          branch: true,
        },
      });
    }

    return prisma.branch.findMany({
      where: {
        gymId: user.gymId,
      },
    });
  }

  static async centralReport(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const cacheKey = `branch:central:report:${user.gymId}`;
    const cached = CacheService.get(cacheKey);
    if (cached) return cached;

    const [branches, members, users, payments, attendances, memberships] =
      await Promise.all([
        prisma.branch.findMany({ where: { gymId: user.gymId } }),
        prisma.member.findMany({ where: { gymId: user.gymId } }),
        prisma.user.findMany({ where: { gymId: user.gymId } }),
        prisma.payment.findMany({ where: { gymId: user.gymId } }),
        prisma.attendance.findMany({ where: { gymId: user.gymId } }),
        prisma.membership.findMany({ where: { gymId: user.gymId } }),
      ]);

    const totalRevenue = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    const activeMemberships = memberships.filter(
      (membership) => membership.endDate >= new Date()
    ).length;

    const trainers = users.filter((u) => u.role === "TRAINER");
    const regionalManagers = users.filter((u) => u.role === "REGIONAL_MANAGER");
    const branchManagers = users.filter((u) => u.role === "BRANCH_MANAGER");

    const result = {
      totalBranches: branches.length,
      activeBranches: branches.filter((b) => b.isActive).length,
      totalMembers: members.length,
      totalStaff: users.length,
      totalTrainers: trainers.length,
      regionalManagers: regionalManagers.length,
      branchManagers: branchManagers.length,
      totalRevenue,
      totalAttendance: attendances.length,
      totalMemberships: memberships.length,
      activeMemberships,
    };

    CacheService.set(cacheKey, result, 600);
    return result;
  }
}