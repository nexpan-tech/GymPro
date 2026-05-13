"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueNotification = void 0;
const db_1 = require("../config/db");
const logger_1 = require("../config/logger");
const enums_1 = require("../constants/enums");
/**
 * Create a notification record in the database
 */
const enqueueNotification = async (data) => {
    try {
        await db_1.prisma.notification.create({
            data: {
                gymId: data.gymId,
                memberId: data.memberId,
                type: enums_1.NOTIFICATION_TYPE[data.type],
                title: data.title,
                message: data.message,
                isSent: false,
            },
        });
        logger_1.logger.info(`Notification queued: ${data.title}`);
    }
    catch (error) {
        logger_1.logger.error("Failed to queue notification:", error);
        throw error;
    }
};
exports.enqueueNotification = enqueueNotification;
