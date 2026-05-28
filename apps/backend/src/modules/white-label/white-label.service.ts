import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

export class WhiteLabelService {
  static async upsertSettings(user: AuthUser, data: any) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.whiteLabelSetting.upsert({
      where: {
        gymId: user.gymId,
      },
      update: {
        appName: data.appName,
        logoUrl: data.logoUrl,
        faviconUrl: data.faviconUrl,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        accentColor: data.accentColor,
        customDomain: data.customDomain,
        mobileAppName: data.mobileAppName,
        playStoreUrl: data.playStoreUrl,
        appStoreUrl: data.appStoreUrl,
      },
      create: {
        gymId: user.gymId,
        appName: data.appName,
        logoUrl: data.logoUrl,
        faviconUrl: data.faviconUrl,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        accentColor: data.accentColor,
        customDomain: data.customDomain,
        mobileAppName: data.mobileAppName,
        playStoreUrl: data.playStoreUrl,
        appStoreUrl: data.appStoreUrl,
      },
    });
  }

  static async getSettings(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.whiteLabelSetting.findUnique({
      where: {
        gymId: user.gymId,
      },
    });
  }

  static async publicSettingsByDomain(domain: string) {
    const settings = await prisma.whiteLabelSetting.findUnique({
      where: {
        customDomain: domain,
      },
      include: {
        gym: true,
      },
    });

    if (!settings) throw new AppError("White label settings not found", 404);

    return {
      appName: settings.appName,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      customDomain: settings.customDomain,
      isDomainVerified: settings.isDomainVerified,
      mobileAppName: settings.mobileAppName,
      playStoreUrl: settings.playStoreUrl,
      appStoreUrl: settings.appStoreUrl,
      gym: {
        id: settings.gym.id,
        name: settings.gym.name,
      },
    };
  }

  static async verifyDomain(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const settings = await prisma.whiteLabelSetting.findUnique({
      where: {
        gymId: user.gymId,
      },
    });

    if (!settings) throw new AppError("White label settings not found", 404);
    if (!settings.customDomain) throw new AppError("Custom domain missing", 400);

    return prisma.whiteLabelSetting.update({
      where: {
        gymId: user.gymId,
      },
      data: {
        isDomainVerified: true,
      },
    });
  }
}