"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipService = void 0;
const db_1 = require("../../config/db");
const response_1 = require("../../utils/response");
class MembershipService {
    static async create(gymId, data) {
        const member = await db_1.prisma.member.findFirst({
            where: { id: data.memberId, gymId },
        });
        if (!member) {
            throw new response_1.AppError("Member not found in this gym", 404);
        }
        return db_1.prisma.membership.create({
            data: {
                gymId,
                memberId: data.memberId,
                plan: data.plan,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                amount: data.amount,
                paymentStatus: data.paymentStatus || "PENDING",
            },
        });
    }
    static async getAll(gymId) {
        return db_1.prisma.membership.findMany({
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
        return db_1.prisma.membership.findMany({
            where: {
                gymId,
                memberId,
            },
            orderBy: { createdAt: "desc" },
        });
    }
    static async update(gymId, id, data) {
        const membership = await db_1.prisma.membership.findFirst({
            where: { id, gymId },
        });
        if (!membership) {
            throw new response_1.AppError("Membership not found", 404);
        }
        return db_1.prisma.membership.update({
            where: { id },
            data: {
                ...data,
                startDate: data.startDate
                    ? new Date(data.startDate)
                    : undefined,
                endDate: data.endDate
                    ? new Date(data.endDate)
                    : undefined,
            },
        });
    }
    static async delete(gymId, id) {
        const membership = await db_1.prisma.membership.findFirst({
            where: { id, gymId },
        });
        if (!membership) {
            throw new response_1.AppError("Membership not found", 404);
        }
        return db_1.prisma.membership.delete({
            where: { id },
        });
    }
}
exports.MembershipService = MembershipService;
