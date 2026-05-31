import { prisma } from "../../config/db";

interface RegisterSessionData {
  deviceId: string;
  platform: string;
  appVersion?: string;
  deviceName?: string;
  pushToken?: string;
}

export class DeviceSessionService {
  static async registerSession(
    userId: string,
    gymId: string | null | undefined,
    data: RegisterSessionData
  ) {
    return prisma.deviceSession.upsert({
      where: {
        userId_deviceId: {
          userId,
          deviceId: data.deviceId,
        },
      },
      update: {
        platform: data.platform,
        appVersion: data.appVersion,
        deviceName: data.deviceName,
        pushToken: data.pushToken,
        gymId: gymId ?? null,
        isActive: true,
        lastSeenAt: new Date(),
      },
      create: {
        userId,
        gymId: gymId ?? null,
        deviceId: data.deviceId,
        platform: data.platform,
        appVersion: data.appVersion,
        deviceName: data.deviceName,
        pushToken: data.pushToken,
        isActive: true,
      },
    });
  }

  static async updatePushToken(
    userId: string,
    deviceId: string,
    pushToken: string
  ) {
    return prisma.deviceSession.update({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
      data: { pushToken },
    });
  }

  static async markSeen(userId: string, deviceId: string) {
    return prisma.deviceSession.update({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
      data: { lastSeenAt: new Date() },
    });
  }

  static async removeSession(userId: string, deviceId: string) {
    return prisma.deviceSession.update({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
      data: { isActive: false },
    });
  }

  static async getUserSessions(userId: string) {
    return prisma.deviceSession.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { lastSeenAt: "desc" },
    });
  }
}
