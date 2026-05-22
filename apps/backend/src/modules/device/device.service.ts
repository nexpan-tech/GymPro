import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

export class DeviceService {
  static async registerToken(
    userId: string,
    data: {
      token: string;
      platform: string;
    }
  ) {
    if (!data.token) {
      throw new AppError("Device token is required", 400);
    }

    return prisma.deviceToken.upsert({
      where: {
        token: data.token,
      },
      update: {
        platform: data.platform,
        userId,
      },
      create: {
        
        token: data.token,
        platform: data.platform,
        userId,
      },
    });
  }

  static async getMyTokens(userId: string) {
    return prisma.deviceToken.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async deleteToken(userId: string, token: string) {
    const deviceToken = await prisma.deviceToken.findFirst({
      where: {
        userId,
        token,
      },
    });

    if (!deviceToken) {
      throw new AppError("Device token not found", 404);
    }

    return prisma.deviceToken.delete({
      where: {
        id: deviceToken.id,
      },
    });
  }
}