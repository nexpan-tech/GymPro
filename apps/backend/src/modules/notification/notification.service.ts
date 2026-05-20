import { prisma } from "../../config/db";
import { notificationQueue } from "../../queues/notification.queue";
import { AppError } from "../../utils/response";
import { buildMessage } from "./notification.utils";

export class NotificationService {
  static async create(
    gymId: string,
    data: {
      memberId?: string;
      type: any;
      title: string;
      message?: string;
    }
  ) {
    let finalMessage = data.message;

    if (data.memberId) {
      const member = await prisma.member.findFirst({
        where: {
          id: data.memberId,
          gymId,
        },
        include: {
          user: true,
        },
      });

      if (!member) {
        throw new AppError("Member not found", 404);
      }

      finalMessage =
        data.message || buildMessage(data.type, member.user.name);
    }

    const notification = await prisma.notification.create({
      data: {
        gymId,
        memberId: data.memberId,
        type: data.type,
        title: data.title,
        message: finalMessage!,
      },
    });

    await notificationQueue.add("send-notification", {
      notificationId: notification.id,
      gymId,
      memberId: data.memberId,
      type: data.type,
      title: data.title,
      message: finalMessage,
    });

    return notification;
  }

  static async getAll(gymId: string) {
    return prisma.notification.findMany({
      where: {
        gymId,
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getByMember(gymId: string, memberId: string) {
    return prisma.notification.findMany({
      where: {
        gymId,
        memberId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async markAsSent(id: string) {
    return prisma.notification.update({
      where: {
        id,
      },
      data: {
        isSent: true,
        sentAt: new Date(),
      },
    });
  }
}