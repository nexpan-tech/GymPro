import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import {
  CreateMembershipInput,
  UpdateMembershipInput,
} from "./membership.validation";

export class MembershipService {
  static async create(gymId: string, data: CreateMembershipInput) {
    const member = await prisma.member.findFirst({
      where: {
        id: data.memberId,
        gymId,
      },
    });

    if (!member) {
      throw new AppError("Member not found in this gym", 404);
    }

    return prisma.membership.create({
      data: {
        gymId,
        memberId: data.memberId,
        plan: data.plan,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        amount: data.amount,
        paymentStatus: data.paymentStatus || "PENDING",
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  static async getAll(gymId: string) {
    return prisma.membership.findMany({
      where: {
        gymId,
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getByMember(gymId: string, memberId: string) {
    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        gymId,
      },
    });

    if (!member) {
      throw new AppError("Member not found in this gym", 404);
    }

    return prisma.membership.findMany({
      where: {
        gymId,
        memberId,
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
    static async getById(gymId: string, id: string) {
    const membership = await prisma.membership.findFirst({
      where: {
        id,
        gymId,
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!membership) {
      throw new AppError("Membership not found", 404);
    }

    return membership;
  }
  
  static async update(
    gymId: string,
    id: string,
    data: UpdateMembershipInput
  ) {
    const membership = await prisma.membership.findFirst({
      where: {
        id,
        gymId,
      },
    });

    if (!membership) {
      throw new AppError("Membership not found", 404);
    }

    return prisma.membership.update({
      where: {
        id,
      },
      data: {
        plan: data.plan,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        amount: data.amount,
        paymentStatus: data.paymentStatus,
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  static async delete(gymId: string, id: string) {
    const membership = await prisma.membership.findFirst({
      where: {
        id,
        gymId,
      },
    });

    if (!membership) {
      throw new AppError("Membership not found", 404);
    }

    return prisma.membership.delete({
      where: {
        id,
      },
    });
  }
}