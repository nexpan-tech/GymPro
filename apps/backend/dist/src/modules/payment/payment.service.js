"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentById = exports.getPayments = exports.createPayment = void 0;
const db_1 = require("../../config/db");
const createPayment = async (gymId, payload) => {
    return db_1.prisma.payment.create({
        data: {
            gymId,
            memberId: payload.memberId,
            amount: payload.amount,
            method: payload.method,
            status: payload.status || "SUCCESS",
        },
    });
};
exports.createPayment = createPayment;
const getPayments = async (gymId) => {
    return db_1.prisma.payment.findMany({
        where: { gymId },
        include: {
            member: {
                include: {
                    user: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getPayments = getPayments;
const getPaymentById = async (gymId, id) => {
    return db_1.prisma.payment.findFirst({
        where: { id, gymId },
        include: {
            member: {
                include: {
                    user: true,
                },
            },
        },
    });
};
exports.getPaymentById = getPaymentById;
