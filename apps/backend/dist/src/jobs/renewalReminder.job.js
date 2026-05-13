"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processRenewalReminders = void 0;
const db_1 = require("../config/db");
const logger_1 = require("../config/logger");
const enums_1 = require("../constants/enums");
/**
 * Create membership renewal reminder notifications
 */
const processRenewalReminders = async () => {
    try {
        const today = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);
        sevenDaysFromNow.setHours(23, 59, 59, 999);
        const expiringMemberships = await db_1.prisma.membership.findMany({
            where: {
                endDate: {
                    gte: today,
                    lte: sevenDaysFromNow,
                },
                paymentStatus: {
                    not: enums_1.PAYMENT_STATUS.PAID,
                },
            },
            select: {
                gymId: true,
                memberId: true,
                endDate: true,
                member: {
                    select: {
                        user: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        let notificationsCreated = 0;
        for (const membership of expiringMemberships) {
            await db_1.prisma.notification.create({
                data: {
                    gymId: membership.gymId,
                    memberId: membership.memberId,
                    type: enums_1.NOTIFICATION_TYPE.MEMBERSHIP_RENEWAL,
                    title: "Membership Renewal Reminder",
                    message: `Hi ${membership.member.user.name}, your membership will expire on ${membership.endDate.toLocaleDateString()}. Please renew to continue your training without interruption.`,
                },
            });
            notificationsCreated++;
        }
        logger_1.logger.info(`Renewal reminder job completed successfully. ${notificationsCreated} notifications created.`);
        return {
            success: true,
            count: notificationsCreated,
        };
    }
    catch (error) {
        logger_1.logger.error("Renewal reminder job failed:", error);
        return {
            success: false,
            count: 0,
        };
    }
};
exports.processRenewalReminders = processRenewalReminders;
