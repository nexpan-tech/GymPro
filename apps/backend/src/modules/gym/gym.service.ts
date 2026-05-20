import { Role } from "@prisma/client";
import { prisma } from "../../config/db";
import { hashPassword } from "../../utils/password";
import { AppError } from "../../utils/response";
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
    const gym = await prisma.gym.findUnique({
      where: { id },
    });

    if (!gym) {
      throw new AppError("Gym not found", 404);
    }

    return prisma.gym.delete({
      where: { id },
    });
  }
}