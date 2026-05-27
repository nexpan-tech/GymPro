import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

export class CampaignService {
  static async create(user: AuthUser, data: any) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    return prisma.campaign.create({
      data: {
        gymId: user.gymId,
        createdById: user.id,
        type: data.type,
        title: data.title,
        message: data.message,
        scheduledAt: data.scheduledAt
          ? new Date(data.scheduledAt)
          : undefined,
      },
    });
  }

  static async getAll(user: AuthUser) {
  if (!user.gymId) {
    throw new AppError("Gym context missing", 403);
  }

  return prisma.campaign.findMany({
    where: {
      gymId: user.gymId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

  static async send(user: AuthUser, id: string) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        gymId: user.gymId,
      },
    });

    if (!campaign) {
      throw new AppError("Campaign not found", 404);
    }

    let targets: any[] = [];

    if (campaign.type === "PROMOTIONAL") {
      targets = await prisma.member.findMany({
        where: {
          gymId: user.gymId,
        },
      });
    }

    if (campaign.type === "REACTIVATION") {
      targets = await prisma.member.findMany({
        where: {
          gymId: user.gymId,
          memberships: {
            some: {
              endDate: {
                lt: new Date(),
              },
            },
          },
        },
      });
    }

    if (campaign.type === "REFERRAL") {
      targets = await prisma.member.findMany({
        where: {
          gymId: user.gymId,
        },
      });
    }

    if (campaign.type === "WHATSAPP") {
        targets = await prisma.member.findMany({
            where: {
            gymId: user.gymId,
            },
        });
        }

    const notifications = [];

    for (const member of targets) {
      const notification = await prisma.notification.create({
        data: {
          gymId: user.gymId,
          memberId: member.id,
          type: "GENERAL",
          title: campaign.title,
          message: campaign.message,
          isSent: true,
          sentAt: new Date(),
        },
      });

      notifications.push(notification);
    }

    const updatedCampaign = await prisma.campaign.update({
      where: {
        id,
      },
      data: {
        sentCount: notifications.length,
        targetCount: targets.length,
        sentAt: new Date(),
      },
    });

    return {
      campaign: updatedCampaign,
      sent: notifications.length,
    };
  }
}