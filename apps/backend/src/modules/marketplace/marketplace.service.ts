import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

export class MarketplaceService {
  static async createItem(user: AuthUser, data: any) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.marketplaceItem.create({
      data: {
        gymId: user.gymId,
        createdById: user.id,
        type: data.type,
        status: data.status || "DRAFT",
        title: data.title,
        description: data.description,
        price: data.price || 0,
        imageUrl: data.imageUrl,
        tags: data.tags || [],
        isFeatured: data.isFeatured || false,
      },
    });
  }

  static async getItems(user: AuthUser, query: any) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.marketplaceItem.findMany({
      where: {
        gymId: user.gymId,
        type: query.type || undefined,
        status: query.status || undefined,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });
  }

  static async publishItem(user: AuthUser, itemId: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const item = await prisma.marketplaceItem.findFirst({
      where: {
        id: itemId,
        gymId: user.gymId,
      },
    });

    if (!item) throw new AppError("Marketplace item not found", 404);

    return prisma.marketplaceItem.update({
      where: { id: itemId },
      data: { status: "PUBLISHED" },
    });
  }

  static async unpublishItem(user: AuthUser, itemId: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const item = await prisma.marketplaceItem.findFirst({
      where: {
        id: itemId,
        gymId: user.gymId,
      },
    });

    if (!item) throw new AppError("Marketplace item not found", 404);

    return prisma.marketplaceItem.update({
      where: { id: itemId },
      data: { status: "UNPUBLISHED" },
    });
  }

  static async publicMarketplace(query: any) {
    return prisma.marketplaceItem.findMany({
      where: {
        status: "PUBLISHED",
        type: query.type || undefined,
      },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });
  }
}