"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const db_1 = require("../../config/db");
const response_1 = require("../../utils/response");
const notification_utils_1 = require("./notification.utils");
class NotificationService {
    static async create(gymId, data) {
        let finalMessage = data.message;
        if (data.memberId) {
            const member = await db_1.prisma.member.findFirst({
                where: { id: data.memberId, gymId },
                include: { user: true },
            });
            if (!member) {
                throw new response_1.AppError("Member not found", 404);
            }
            finalMessage =
                data.message ||
                    (0, notification_utils_1.buildMessage)(data.type, member.user.name);
        }
        return db_1.prisma.notification.create({
            data: {
                gymId,
                memberId: data.memberId,
                type: data.type,
                title: data.title,
                message: finalMessage,
            },
        });
    }
    static async getAll(gymId) {
        return db_1.prisma.notification.findMany({
            where: { gymId },
            include: {
                member: {
                    include: { user: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    static async getByMember(gymId, memberId) {
        return db_1.prisma.notification.findMany({
            where: { gymId, memberId },
            orderBy: { createdAt: "desc" },
        });
    }
    static async markAsSent(id) {
        return db_1.prisma.notification.update({
            where: { id },
            data: {
                isSent: true,
                sentAt: new Date(),
            },
        });
    }
}
exports.NotificationService = NotificationService;
