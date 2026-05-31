import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

function calculateBmi(weight?: number, height?: number | null) {
  if (!weight || !height) return null;

  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(2));
}

export class ProgressService {
  private static async getMemberForAccess(user: AuthUser, memberId: string) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        gymId: user.gymId,
      },
      include: {
        user: true,
      },
    });

    if (!member) {
      throw new AppError("Member not found in this gym", 404);
    }

    if (user.role === "MEMBER" && member.userId !== user.id) {
      throw new AppError("You can only access your own progress", 403);
    }

    if (user.role === "TRAINER" && member.trainerId !== user.id) {
      throw new AppError("You can only access assigned member progress", 403);
    }

    return member;
  }

  static async createMeasurement(user: AuthUser, data: any) {
    const member = await this.getMemberForAccess(user, data.memberId);

    const bmi = calculateBmi(Number(data.weight), member.height);

    return prisma.bodyMeasurement.create({
      data: {
        gymId: user.gymId!,
        memberId: data.memberId,
        weight: data.weight ? Number(data.weight) : undefined,
        chest: data.chest ? Number(data.chest) : undefined,
        waist: data.waist ? Number(data.waist) : undefined,
        hips: data.hips ? Number(data.hips) : undefined,
        arms: data.arms ? Number(data.arms) : undefined,
        thighs: data.thighs ? Number(data.thighs) : undefined,
        bodyFatPercentage: data.bodyFatPercentage
          ? Number(data.bodyFatPercentage)
          : undefined,
        bmi: bmi ?? undefined,
        notes: data.notes,
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

  static async getMemberMeasurements(user: AuthUser, memberId: string) {
    await this.getMemberForAccess(user, memberId);

    return prisma.bodyMeasurement.findMany({
      where: {
        gymId: user.gymId!,
        memberId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getMyMeasurements(user: AuthUser) {
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

    return this.getMemberMeasurements(user, member.id);
  }

  static async getProgressSummary(user: AuthUser, memberId: string) {
    await this.getMemberForAccess(user, memberId);

    const measurements = await prisma.bodyMeasurement.findMany({
      where: {
        gymId: user.gymId!,
        memberId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (measurements.length === 0) {
      return {
        totalEntries: 0,
        message: "No progress data available",
      };
    }

    const first = measurements[0];
    const latest = measurements[measurements.length - 1];

    return {
      totalEntries: measurements.length,
      firstEntry: first,
      latestEntry: latest,
      changes: {
        weight: Number((Number(latest.weight || 0) - Number(first.weight || 0)).toFixed(2)),
        chest: Number((Number(latest.chest || 0) - Number(first.chest || 0)).toFixed(2)),
        waist: Number((Number(latest.waist || 0) - Number(first.waist || 0)).toFixed(2)),
        hips: Number((Number(latest.hips || 0) - Number(first.hips || 0)).toFixed(2)),
        bmi: Number((Number(latest.bmi || 0) - Number(first.bmi || 0)).toFixed(2)),
      },
    };
  }

  static async deleteMeasurement(user: AuthUser, id: string) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    const measurement = await prisma.bodyMeasurement.findFirst({
      where: {
        id,
        gymId: user.gymId,
      },
      include: {
        member: true,
      },
    });

    if (!measurement) {
      throw new AppError("Measurement not found", 404);
    }

    if (user.role === "MEMBER" && measurement.member.userId !== user.id) {
      throw new AppError("You can only delete your own progress", 403);
    }

    if (user.role === "TRAINER" && measurement.member.trainerId !== user.id) {
      throw new AppError("You can only delete assigned member progress", 403);
    }

    return prisma.bodyMeasurement.delete({
      where: {
        id,
      },
    });
  }

  static async getAnalytics(user: AuthUser, memberId: string) {
  await this.getMemberForAccess(user, memberId);

  const measurements = await prisma.bodyMeasurement.findMany({
    where: {
      gymId: user.gymId!,
      memberId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (measurements.length === 0) {
    return {
      totalEntries: 0,
      message: "No progress data available",
    };
  }

  const first = measurements[0];
  const latest = measurements[measurements.length - 1];

  const weightChange = Number(
    (Number(latest.weight || 0) - Number(first.weight || 0)).toFixed(2)
  );

  const waistChange = Number(
    (Number(latest.waist || 0) - Number(first.waist || 0)).toFixed(2)
  );

  const bodyFatChange = Number(
    (
      Number(latest.bodyFatPercentage || 0) -
      Number(first.bodyFatPercentage || 0)
    ).toFixed(2)
  );

  const bmiChange = Number(
    (Number(latest.bmi || 0) - Number(first.bmi || 0)).toFixed(2)
  );

  const timeline = measurements.map((entry) => ({
    date: entry.createdAt,
    weight: entry.weight,
    waist: entry.waist,
    bodyFatPercentage: entry.bodyFatPercentage,
    bmi: entry.bmi,
    notes: entry.notes,
  }));

  return {
    totalEntries: measurements.length,
    firstEntry: first,
    latestEntry: latest,
    changes: {
      weight: weightChange,
      waist: waistChange,
      bodyFatPercentage: bodyFatChange,
      bmi: bmiChange,
    },
    analytics: {
      weightTrend:
        weightChange < 0
          ? "DECREASING"
          : weightChange > 0
          ? "INCREASING"
          : "STABLE",
      waistTrend:
        waistChange < 0
          ? "DECREASING"
          : waistChange > 0
          ? "INCREASING"
          : "STABLE",
      bodyFatTrend:
        bodyFatChange < 0
          ? "DECREASING"
          : bodyFatChange > 0
          ? "INCREASING"
          : "STABLE",
      bmiTrend:
        bmiChange < 0
          ? "DECREASING"
          : bmiChange > 0
          ? "INCREASING"
          : "STABLE",
    },
    timeline,
  };
}

  // ---------------------------------------------------------------------------
  // Progress photos (mobile)
  // ---------------------------------------------------------------------------

  private static async getMyMember(user: AuthUser) {
    if (user.role !== "MEMBER") {
      throw new AppError("Only members can manage their own progress photos", 403);
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

    return member;
  }

  static async createPhoto(user: AuthUser, imageUrl: string, notes?: string) {
    const member = await this.getMyMember(user);

    return prisma.progressPhoto.create({
      data: {
        gymId: user.gymId!,
        memberId: member.id,
        imageUrl,
        notes: notes || undefined,
      },
    });
  }

  static async getMyPhotos(user: AuthUser) {
    const member = await this.getMyMember(user);

    return prisma.progressPhoto.findMany({
      where: {
        gymId: user.gymId!,
        memberId: member.id,
      },
      orderBy: {
        takenAt: "desc",
      },
    });
  }

  static async deletePhoto(user: AuthUser, id: string) {
    const member = await this.getMyMember(user);

    const photo = await prisma.progressPhoto.findFirst({
      where: {
        id,
        gymId: user.gymId!,
        memberId: member.id,
      },
    });

    if (!photo) {
      throw new AppError("Progress photo not found", 404);
    }

    return prisma.progressPhoto.delete({
      where: {
        id: photo.id,
      },
    });
  }
}