import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

export class ExerciseService {
  static async create(user: AuthUser, data: any) {
    if (!user.gymId && user.role !== "SUPER_ADMIN") {
      throw new AppError("Gym context missing", 403);
    }

    return prisma.exercise.create({
      data: {
        gymId: user.role === "SUPER_ADMIN" ? null : user.gymId,
        name: data.name,
        description: data.description,
        category: data.category,
        muscleGroup: data.muscleGroup,
        difficulty: data.difficulty,
        equipment: data.equipment,
        instructions: data.instructions,
        videoUrl: data.videoUrl,
        imageUrl: data.imageUrl,
        caloriesBurned: data.caloriesBurned
          ? Number(data.caloriesBurned)
          : undefined,
        durationMinutes: data.durationMinutes
          ? Number(data.durationMinutes)
          : undefined,
        isPublic:
          typeof data.isPublic === "boolean" ? data.isPublic : true,
      },
    });
  }

  static async getAll(
    user: AuthUser,
    filters: {
      category?: string;
      muscleGroup?: string;
      difficulty?: string;
      search?: string;
    }
  ) {
    if (!user.gymId && user.role !== "SUPER_ADMIN") {
      throw new AppError("Gym context missing", 403);
    }

    const where: Prisma.ExerciseWhereInput = {
      OR: [
        { isPublic: true },
        ...(user.gymId ? [{ gymId: user.gymId }] : []),
      ],
      ...(filters.category ? { category: filters.category as any } : {}),
      ...(filters.muscleGroup ? { muscleGroup: filters.muscleGroup as any } : {}),
      ...(filters.difficulty ? { difficulty: filters.difficulty as any } : {}),
      ...(filters.search
        ? {
            name: {
              contains: filters.search,
              mode: "insensitive",
            },
          }
        : {}),
    };

    return prisma.exercise.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getById(user: AuthUser, id: string) {
    if (!user.gymId && user.role !== "SUPER_ADMIN") {
      throw new AppError("Gym context missing", 403);
    }

    const exercise = await prisma.exercise.findFirst({
      where: {
        id,
        OR: [
          { isPublic: true },
          ...(user.gymId ? [{ gymId: user.gymId }] : []),
        ],
      },
    });

    if (!exercise) {
      throw new AppError("Exercise not found", 404);
    }

    return exercise;
  }

  static async update(user: AuthUser, id: string, data: any) {
    if (!user.gymId && user.role !== "SUPER_ADMIN") {
      throw new AppError("Gym context missing", 403);
    }

    const exercise = await prisma.exercise.findFirst({
      where: {
        id,
        ...(user.role === "SUPER_ADMIN"
          ? {}
          : {
              gymId: user.gymId,
            }),
      },
    });

    if (!exercise) {
      throw new AppError("Exercise not found or not editable", 404);
    }

    return prisma.exercise.update({
      where: {
        id,
      },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        muscleGroup: data.muscleGroup,
        difficulty: data.difficulty,
        equipment: data.equipment,
        instructions: data.instructions,
        videoUrl: data.videoUrl,
        imageUrl: data.imageUrl,
        caloriesBurned:
          data.caloriesBurned !== undefined
            ? Number(data.caloriesBurned)
            : undefined,
        durationMinutes:
          data.durationMinutes !== undefined
            ? Number(data.durationMinutes)
            : undefined,
        isPublic:
          typeof data.isPublic === "boolean" ? data.isPublic : undefined,
      },
    });
  }

  static async delete(user: AuthUser, id: string) {
    if (!user.gymId && user.role !== "SUPER_ADMIN") {
      throw new AppError("Gym context missing", 403);
    }

    const exercise = await prisma.exercise.findFirst({
      where: {
        id,
        ...(user.role === "SUPER_ADMIN"
          ? {}
          : {
              gymId: user.gymId,
            }),
      },
    });

    if (!exercise) {
      throw new AppError("Exercise not found or not deletable", 404);
    }

    return prisma.exercise.delete({
      where: {
        id,
      },
    });
  }
}