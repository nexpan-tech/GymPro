import { Role } from "@prisma/client";
import { prisma } from "../../config/db";
import { hashPassword } from "../../utils/password";
import { AppError } from "../../utils/response";
import {
  CreateMemberInput,
  UpdateMemberInput,
} from "./member.validation";

interface AuthUser {
  id: string;
  role: Role;
  gymId: string | null;
}

export class MemberService {
  static async create(gymId: string, data: CreateMemberInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError("User already exists with this email", 400);
    }

    if (data.trainerId) {
      const trainer = await prisma.user.findFirst({
        where: {
          id: data.trainerId,
          gymId,
          role: Role.TRAINER,
          isActive: true,
        },
      });

      if (!trainer) {
        throw new AppError("Trainer not found in this gym", 404);
      }
    }

    const passwordHash = await hashPassword(data.password);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: Role.MEMBER,
          gymId,
          isActive: true,
        },
      });

      return tx.member.create({
        data: {
          gymId,
          userId: user.id,
          phone: data.phone,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth
            ? new Date(data.dateOfBirth)
            : undefined,
          address: data.address,
          height: data.height,
          weight: data.weight,
          fitnessGoal: data.fitnessGoal,
          trainerId: data.trainerId,
        },
        include: {
          user: true,
          trainer: true,
        },
      });
    });
  }

  static async getAll(user: AuthUser) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    const where =
      user.role === Role.TRAINER
        ? { gymId: user.gymId, trainerId: user.id }
        : user.role === Role.MEMBER
          ? { gymId: user.gymId, userId: user.id }
          : { gymId: user.gymId };

    return prisma.member.findMany({
      where,
      include: {
        user: true,
        trainer: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getById(user: AuthUser, id: string) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    const member = await prisma.member.findFirst({
      where: { id, gymId: user.gymId },
      include: {
        user: true,
        trainer: true,
        memberships: true,
        attendances: true,
        dietPlan: true,
        workoutPlan: true,
      },
    });

    if (!member) {
      throw new AppError("Member not found", 404);
    }

    if (user.role === Role.TRAINER && member.trainerId !== user.id) {
      throw new AppError("You can only access assigned members", 403);
    }

    if (user.role === Role.MEMBER && member.userId !== user.id) {
      throw new AppError("You can only access your own profile", 403);
    }

    return member;
  }

  static async update(gymId: string, id: string, data: UpdateMemberInput) {
    const member = await prisma.member.findFirst({
      where: { id, gymId },
    });

    if (!member) {
      throw new AppError("Member not found", 404);
    }

    if (data.trainerId) {
      const trainer = await prisma.user.findFirst({
        where: {
          id: data.trainerId,
          gymId,
          role: Role.TRAINER,
          isActive: true,
        },
      });

      if (!trainer) {
        throw new AppError("Trainer not found in this gym", 404);
      }
    }

    return prisma.member.update({
      where: { id },
      data: {
        phone: data.phone,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth
          ? new Date(data.dateOfBirth)
          : undefined,
        address: data.address,
        height: data.height,
        weight: data.weight,
        fitnessGoal: data.fitnessGoal,
        trainerId: data.trainerId,
      },
      include: {
        user: true,
        trainer: true,
      },
    });
  }

  static async delete(gymId: string, id: string) {
    const member = await prisma.member.findFirst({
      where: { id, gymId },
    });

    if (!member) {
      throw new AppError("Member not found", 404);
    }

    return prisma.$transaction(async (tx) => {
      await tx.member.delete({
        where: { id },
      });

      await tx.user.delete({
        where: { id: member.userId },
      });

      return { id };
    });
  }
}