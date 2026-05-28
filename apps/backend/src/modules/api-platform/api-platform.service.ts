import crypto from "crypto";
import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

function generateApiKey() {
  return `gpk_${crypto.randomBytes(32).toString("hex")}`;
}

function hashApiKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function generateSecret() {
  return crypto.randomBytes(24).toString("hex");
}

export class ApiPlatformService {
  static async createApiKey(user: AuthUser, data: any) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);

    const apiKey = await prisma.apiKey.create({
      data: {
        gymId: user.gymId,
        name: data.name,
        keyHash,
      },
    });

    return {
      apiKey,
      rawKey,
    };
  }

  static async getApiKeys(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.apiKey.findMany({
      where: {
        gymId: user.gymId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async revokeApiKey(user: AuthUser, apiKeyId: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        gymId: user.gymId,
      },
    });

    if (!apiKey) throw new AppError("API key not found", 404);

    return prisma.apiKey.update({
      where: { id: apiKeyId },
      data: {
        status: "REVOKED",
      },
    });
  }

  static async createWebhook(user: AuthUser, data: any) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.webhookEndpoint.create({
      data: {
        gymId: user.gymId,
        url: data.url,
        events: data.events || [],
        secret: generateSecret(),
      },
    });
  }

  static async getWebhooks(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.webhookEndpoint.findMany({
      where: {
        gymId: user.gymId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async createIntegration(user: AuthUser, data: any) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.integration.create({
      data: {
        gymId: user.gymId,
        provider: data.provider,
        status: data.status || "ACTIVE",
        config: data.config || {},
      },
    });
  }

  static async getIntegrations(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.integration.findMany({
      where: {
        gymId: user.gymId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async validatePublicApiKey(rawKey: string) {
    const keyHash = hashApiKey(rawKey);

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        keyHash,
        status: "ACTIVE",
      },
      include: {
        gym: true,
      },
    });

    if (!apiKey) throw new AppError("Invalid API key", 401);

    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: {
        lastUsedAt: new Date(),
      },
    });

    return apiKey;
  }

  static async publicGymProfile(rawKey: string) {
    const apiKey = await this.validatePublicApiKey(rawKey);

    return {
      gymId: apiKey.gym.id,
      name: apiKey.gym.name,
      email: apiKey.gym.email,
      phone: apiKey.gym.phone,
      address: apiKey.gym.address,
    };
  }
}