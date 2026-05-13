"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GymService = void 0;
const db_1 = require("../../config/db");
const response_1 = require("../../utils/response");
class GymService {
    static async create(data) {
        const existing = await db_1.prisma.gym.findUnique({
            where: { email: data.email },
        });
        if (existing) {
            throw new response_1.AppError("Gym already exists with this email", 400);
        }
        return db_1.prisma.gym.create({
            data: {
                ...data,
            },
        });
    }
    static async getAll() {
        return db_1.prisma.gym.findMany({
            orderBy: { createdAt: "desc" },
        });
    }
    static async getById(id) {
        const gym = await db_1.prisma.gym.findUnique({
            where: { id },
            include: {
                users: true,
                members: true,
            },
        });
        if (!gym) {
            throw new response_1.AppError("Gym not found", 404);
        }
        return gym;
    }
    static async update(id, data) {
        const gym = await db_1.prisma.gym.findUnique({ where: { id } });
        if (!gym) {
            throw new response_1.AppError("Gym not found", 404);
        }
        return db_1.prisma.gym.update({
            where: { id },
            data,
        });
    }
    static async activate(id) {
        return db_1.prisma.gym.update({
            where: { id },
            data: { isActive: true },
        });
    }
    static async deactivate(id) {
        return db_1.prisma.gym.update({
            where: { id },
            data: { isActive: false },
        });
    }
    static async delete(id) {
        const gym = await db_1.prisma.gym.findUnique({ where: { id } });
        if (!gym) {
            throw new response_1.AppError("Gym not found", 404);
        }
        return db_1.prisma.gym.delete({
            where: { id },
        });
    }
}
exports.GymService = GymService;
