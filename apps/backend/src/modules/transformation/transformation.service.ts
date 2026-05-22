import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

type ProgressPhotoType = "BEFORE" | "PROGRESS" | "AFTER";

export class TransformationService {
  private static async getMemberForAccess(user: AuthUser, memberId: string) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        gymId: user.gymId,
      },
    });

    if (!member) {
      throw new AppError("Member not found in this gym", 404);
    }

    if (user.role === "MEMBER" && member.userId !== user.id) {
      throw new AppError("You can only access your own transformation", 403);
    }

    if (user.role === "TRAINER" && member.trainerId !== user.id) {
      throw new AppError("You can only access assigned member transformation", 403);
    }

    return member;
  }

  static async addPhoto(
    user: AuthUser,
    data: {
      memberId: string;
      imageUrl: string;
      type?: ProgressPhotoType;
      notes?: string;
      takenAt?: string;
    }
  ) {
    await this.getMemberForAccess(user, data.memberId);

    if (!data.imageUrl) {
      throw new AppError("Image URL is required", 400);
    }

    return prisma.progressPhoto.create({
      data: {
        gymId: user.gymId!,
        memberId: data.memberId,
        imageUrl: data.imageUrl,
        type: data.type || "PROGRESS",
        notes: data.notes,
        takenAt: data.takenAt ? new Date(data.takenAt) : new Date(),
      },
    });
  }

  static async getMemberPhotos(user: AuthUser, memberId: string) {
    await this.getMemberForAccess(user, memberId);

    return prisma.progressPhoto.findMany({
      where: {
        gymId: user.gymId!,
        memberId,
      },
      orderBy: {
        takenAt: "desc",
      },
    });
  }

  static async getMyPhotos(user: AuthUser) {
    if (user.role !== "MEMBER") {
      throw new AppError("Only members can access this route", 403);
    }

    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    const member = await prisma.member.findFirst({
      where: {
        userId: user.id,
        gymId: user.gymId,
      },
    });

    if (!member) {
      throw new AppError("Member profile not found", 404);
    }

    return this.getMemberPhotos(user, member.id);
  }

  static async getBeforeAfter(user: AuthUser, memberId: string) {
    await this.getMemberForAccess(user, memberId);

    const before = await prisma.progressPhoto.findFirst({
      where: {
        gymId: user.gymId!,
        memberId,
        type: "BEFORE",
      },
      orderBy: {
        takenAt: "asc",
      },
    });

    const after = await prisma.progressPhoto.findFirst({
      where: {
        gymId: user.gymId!,
        memberId,
        type: "AFTER",
      },
      orderBy: {
        takenAt: "desc",
      },
    });

    return {
      before,
      after,
    };
  }

  static async getTimeline(user: AuthUser, memberId: string) {
    await this.getMemberForAccess(user, memberId);

    const photos = await prisma.progressPhoto.findMany({
      where: {
        gymId: user.gymId!,
        memberId,
      },
      orderBy: {
        takenAt: "asc",
      },
    });

    const measurements = await prisma.bodyMeasurement.findMany({
      where: {
        gymId: user.gymId!,
        memberId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return {
      photos,
      measurements,
      totalPhotos: photos.length,
      totalMeasurements: measurements.length,
    };
  }

  static async deletePhoto(user: AuthUser, id: string) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    const photo = await prisma.progressPhoto.findFirst({
      where: {
        id,
        gymId: user.gymId,
      },
      include: {
        member: true,
      },
    });

    if (!photo) {
      throw new AppError("Progress photo not found", 404);
    }

    if (user.role === "MEMBER" && photo.member.userId !== user.id) {
      throw new AppError("You can only delete your own transformation photo", 403);
    }

    if (user.role === "TRAINER" && photo.member.trainerId !== user.id) {
      throw new AppError("You can only delete assigned member photo", 403);
    }

    return prisma.progressPhoto.delete({
      where: {
        id,
      },
    });
  }
}