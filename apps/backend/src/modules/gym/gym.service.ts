import { Role } from "@prisma/client";
import { prisma } from "../../config/db";
import { hashPassword } from "../../utils/password";
import { AppError } from "../../utils/response";
import { logger } from "../../config/logger";
import { LicenseService } from "../license/license.service";
import { CreateGymInput, UpdateGymInput } from "./gym.validation";

export class GymService {
  static async create(data: CreateGymInput) {
    const existingGym = await prisma.gym.findUnique({
      where: { email: data.email },
    });

    if (existingGym) {
      throw new AppError("Gym already exists with this email", 400);
    }

    if (data.adminEmail) {
      const existingAdmin = await prisma.user.findUnique({
        where: { email: data.adminEmail },
      });

      if (existingAdmin) {
        throw new AppError("Admin already exists with this email", 400);
      }
    }

    const gym = await prisma.gym.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        logo: data.logo,
        pricePerActiveMember: data.pricePerActiveMember ?? 0,
      },
    });

    let admin = null;

    if (data.adminName && data.adminEmail && data.adminPassword) {
      const passwordHash = await hashPassword(data.adminPassword);

      admin = await prisma.user.create({
        data: {
          name: data.adminName,
          email: data.adminEmail,
          passwordHash,
          role: Role.ADMIN,
          gymId: gym.id,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          gymId: true,
          isActive: true,
          createdAt: true,
        },
      });
    }

    // Every gym MUST have exactly one SaaS license. Assign the chosen plan, or
    // default to the cheapest *paid* active plan (auto-seeded). Non-fatal: the
    // gym is created regardless; a failed assignment can be retried from
    // License Management. This makes EVERY creation path (UI, API, scripts)
    // produce a licensed gym.
    try {
      let planId = data.planId;
      if (!planId) {
        const plans = await LicenseService.listPlans(); // auto-seeds + ordered by price asc
        planId = plans.find((p) => p.price > 0)?.id ?? plans[0]?.id;
      }
      if (planId) {
        await LicenseService.assignPlan(
          gym.id,
          { planId, trialDays: data.trialDays ?? 0 },
          { source: "auto", userId: null },
        );
      } else {
        logger.warn(`[gym] no plan available to license new gym ${gym.id}`);
      }
    } catch (err) {
      logger.warn(`[gym] auto-license assignment failed for ${gym.id}`, { err: String(err) });
    }

    return {
      gym,
      admin,
    };
  }

  static async getAll() {
    return prisma.gym.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            users: true,
            members: true,
          },
        },
      },
    });
  }

  static async getById(id: string) {
    const gym = await prisma.gym.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        members: true,
        _count: {
          select: {
            users: true,
            members: true,
            payments: true,
          },
        },
      },
    });

    if (!gym) {
      throw new AppError("Gym not found", 404);
    }

    return gym;
  }

  static async update(id: string, data: UpdateGymInput) {
    const gym = await prisma.gym.findUnique({
      where: { id },
    });

    if (!gym) {
      throw new AppError("Gym not found", 404);
    }

    if (data.email && data.email !== gym.email) {
      const existing = await prisma.gym.findUnique({
        where: { email: data.email },
      });

      if (existing) {
        throw new AppError("Another gym already uses this email", 400);
      }
    }

    return prisma.gym.update({
      where: { id },
      data,
    });
  }

  static async activate(id: string) {
    return prisma.gym.update({
      where: { id },
      data: { isActive: true },
    });
  }

  static async deactivate(id: string) {
    return prisma.gym.update({
      where: { id },
      data: { isActive: false },
    });
  }

  static async delete(id: string) {
    const gym = await prisma.gym.findUnique({ where: { id } });
    if (!gym) {
      throw new AppError("Gym not found", 404);
    }

    // PRODUCTION SAFETY: never hard-delete a gym that holds real tenant data —
    // it would irreversibly destroy member, payment and invoice records (and the
    // FK RESTRICT constraints make a raw delete 500 anyway). Direct the operator
    // to Suspend/Deactivate instead (the action the Super Admin UI uses).
    const [members, payments, memberInvoices] = await Promise.all([
      prisma.member.count({ where: { gymId: id } }),
      prisma.payment.count({ where: { gymId: id } }),
      prisma.invoice.count({ where: { gymId: id } }),
    ]);
    if (members > 0 || payments > 0 || memberInvoices > 0) {
      throw new AppError(
        "Cannot delete a gym with members, payments or invoices. Deactivate (suspend) it instead to preserve records.",
        400,
        { code: "GYM_HAS_DATA", members, payments, invoices: memberInvoices },
      );
    }

    // Empty gym (e.g. created in error / a test gym): clean the license, billing
    // and config artifacts that hold RESTRICT foreign keys, then delete — all in
    // ONE transaction so it's atomic (no orphan subscription/invoice/flag left).
    return prisma.$transaction(async (tx) => {
      await tx.saaSInvoice.deleteMany({ where: { gymId: id } });
      await tx.gymSubscription.deleteMany({ where: { gymId: id } });
      await tx.featureFlagAssignment.deleteMany({ where: { gymId: id } });
      await tx.auditLog.deleteMany({ where: { gymId: id } });
      await tx.branch.deleteMany({ where: { gymId: id } });
      await tx.user.deleteMany({ where: { gymId: id } });
      return tx.gym.delete({ where: { id } });
    });
  }
}