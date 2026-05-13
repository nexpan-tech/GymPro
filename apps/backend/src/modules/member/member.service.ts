import { prisma } from "../../config/db";
import { hashPassword } from "../../utils/password";
import { AppError } from "../../utils/response";
import {
  CreateMemberInput,
  UpdateMemberInput,
} from "./member.validation";

export class MemberService {
  static async create(gymId: string, data: CreateMemberInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError("User already exists", 400);
    }

    const passwordHash = await hashPassword(data.password);

    // 1. Create User
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: "MEMBER",
        gymId,
      },
    });

    // 2. Create Member profile
    const member = await prisma.member.create({
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
      },
    });

    return member;
  }

  static async getAll(gymId: string) {
    return prisma.member.findMany({
      where: { gymId },
      include: {
        user: true,
        trainer: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getById(gymId: string, id: string) {
    const member = await prisma.member.findFirst({
      where: { id, gymId },
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

    return member;
  }

  static async update(
    gymId: string,
    id: string,
    data: UpdateMemberInput
  ) {
    const member = await prisma.member.findFirst({
      where: { id, gymId },
    });

    if (!member) {
      throw new AppError("Member not found", 404);
    }

    return prisma.member.update({
      where: { id },
      data,
    });
  }

  static async delete(gymId: string, id: string) {
    const member = await prisma.member.findFirst({
      where: { id, gymId },
    });

    if (!member) {
      throw new AppError("Member not found", 404);
    }

    return prisma.member.delete({
      where: { id },
    });
  }
}