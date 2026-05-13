"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processNotifications = void 0;
const db_1 = require("../config/db");
const logger_1 = require("../config/logger");
/**
 * Sends pending notifications
 */
const processNotifications = async () => {
    try {
        const notifications = await db_1.prisma.notification.findMany({
            where: {
                isSent: false,
            },
            include: {
                member: {
                    include: {
                        user: true,
                    },
                },
                gym: true,
            },
        });
        for (const n of notifications) {
            // 🚀 Replace this later with SMS / WhatsApp / Push service
            logger_1.logger.info(`📩 Sending notification: ${n.title} -> ${n.member?.user?.name || "ALL"}`);
            await db_1.prisma.notification.update({
                where: { id: n.id },
                data: {
                    isSent: true,
                    sentAt: new Date(),
                },
            });
        }
        logger_1.logger.info(`✅ Notifications processed: ${notifications.length}`);
        return {
            success: true,
            processed: notifications.length,
        };
    }
    catch (error) {
        logger_1.logger.error("❌ Notification Job Failed", error);
        return {
            success: false,
        };
    }
};
exports.processNotifications = processNotifications;
