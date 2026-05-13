"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberService = void 0;
const db_1 = require("../../config/db");
const password_1 = require("../../utils/password");
const response_1 = require("../../utils/response");
class MemberService {
    static async create(gymId, data) {
        const existingUser = await db_1.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw new response_1.AppError("User already exists", 400);
        }
        const passwordHash = await (0, password_1.hashPassword)(data.password);
        // 1. Create User
        const user = await db_1.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash,
                role: "MEMBER",
                gymId,
            },
        });
        // 2. Create Member profile
        const member = await db_1.prisma.member.create({
            data: {
                gymId,
                userId: user.id,
                phone: data.phone,
                gender: data.gender,
                dateOfBirth: data.dateOfBirth
                    ? new Date(data.dateOfBirth)
                    : undefined,
                address: data.address,
                height: data.height,
                weight: data.weight,
                fitnessGoal: data.fitnessGoal,
                trainerId: data.trainerId,
            },
            include: {
                user: true,
            },
        });
        return member;
    }
    static async getAll(gymId) {
        return db_1.prisma.member.findMany({
            where: { gymId },
            include: {
                user: true,
                trainer: true,
            },
            orderBy: { createdAt: "desc" },
        });
    }
    static async getById(gymId, id) {
        const member = await db_1.prisma.member.findFirst({
            where: { id, gymId },
            include: {
                user: true,
                trainer: true,
                memberships: true,
                attendances: true,
                dietPlan: true,
                workoutPlan: true,
            },
        });
        if (!member) {
            throw new response_1.AppError("Member not found", 404);
        }
        return member;
    }
    static async update(gymId, id, data) {
        const member = await db_1.prisma.member.findFirst({
            where: { id, gymId },
        });
        if (!member) {
            throw new response_1.AppError("Member not found", 404);
        }
        return db_1.prisma.member.update({
            where: { id },
            data,
        });
    }
    static async delete(gymId, id) {
        const member = await db_1.prisma.member.findFirst({
            where: { id, gymId },
        });
        if (!member) {
            throw new response_1.AppError("Member not found", 404);
        }
        return db_1.prisma.member.delete({
            where: { id },
        });
    }
}
exports.MemberService = MemberService;
