import { prisma } from "../../config/db";
import { CreateGymInput, UpdateGymInput } from "./gym.validation";
import { AppError } from "../../utils/response";

export class GymService {
  static async create(data: CreateGymInput) {
    const existing = await prisma.gym.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new AppError("Gym already exists with this email", 400);
    }

    return prisma.gym.create({
      data: {
        ...data,
      },
    });
  }

  static async getAll() {
    return prisma.gym.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  static async getById(id: string) {
    const gym = await prisma.gym.findUnique({
      where: { id },
      include: {
        users: true,
        members: true,
      },
    });

    if (!gym) {
      throw new AppError("Gym not found", 404);
    }

    return gym;
  }

  static async update(id: string, data: UpdateGymInput) {
    const gym = await prisma.gym.findUnique({ where: { id } });

    if (!gym) {
      throw new AppError("Gym not found", 404);
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

    return prisma.gym.delete({
      where: { id },
    });
  }
}