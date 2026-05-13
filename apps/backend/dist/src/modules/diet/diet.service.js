"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DietService = void 0;
const db_1 = require("../../config/db");
const response_1 = require("../../utils/response");
class DietService {
    static async create(gymId, data) {
        const member = await db_1.prisma.member.findFirst({
            where: { id: data.memberId, gymId },
        });
        if (!member) {
            throw new response_1.AppError("Member not found in this gym", 404);
        }
        const existing = await db_1.prisma.dietPlan.findUnique({
            where: { memberId: data.memberId },
        });
        if (existing) {
            throw new response_1.AppError("Diet plan already exists for this member", 400);
        }
        return db_1.prisma.dietPlan.create({
            data: {
                gymId,
                ...data,
            },
        });
    }
    static async getAll(gymId) {
        return db_1.prisma.dietPlan.findMany({
            where: { gymId },
            include: {
                member: {
                    include: { user: true },
                },
            },
        });
    }
    static async getByMember(gymId, memberId) {
        return db_1.prisma.dietPlan.findFirst({
            where: { gymId, memberId },
        });
    }
    static async update(gymId, memberId, data) {
        const plan = await db_1.prisma.dietPlan.findFirst({
            where: { gymId, memberId },
        });
        if (!plan) {
            throw new response_1.AppError("Diet plan not found", 404);
        }
        return db_1.prisma.dietPlan.update({
            where: { id: plan.id },
            data,
        });
    }
    static async delete(gymId, memberId) {
        const plan = await db_1.prisma.dietPlan.findFirst({
            where: { gymId, memberId },
        });
        if (!plan) {
            throw new response_1.AppError("Diet plan not found", 404);
        }
        return db_1.prisma.dietPlan.delete({
            where: { id: plan.id },
        });
    }
}
exports.DietService = DietService;
