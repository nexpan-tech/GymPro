"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const db_1 = require("../../config/db");
const password_1 = require("../../utils/password");
const jwt_1 = require("../../utils/jwt");
const response_1 = require("../../utils/response");
class AuthService {
    static async register(data) {
        const existingUser = await db_1.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw new response_1.AppError("User already exists", 400);
        }
        const passwordHash = await (0, password_1.hashPassword)(data.password);
        const user = await db_1.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash,
                role: data.role || "MEMBER",
                gymId: data.gymId,
            },
        });
        const token = (0, jwt_1.generateToken)({
            id: user.id,
            role: user.role,
            gymId: user.gymId,
        });
        return { user, token };
    }
    static async login(data) {
        const user = await db_1.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (!user) {
            throw new response_1.AppError("Invalid credentials", 401);
        }
        const isValid = await (0, password_1.comparePassword)(data.password, user.passwordHash);
        if (!isValid) {
            throw new response_1.AppError("Invalid credentials", 401);
        }
        const token = (0, jwt_1.generateToken)({
            id: user.id,
            role: user.role,
            gymId: user.gymId,
        });
        return { user, token };
    }
    static async me(id) {
        return db_1.prisma.user.findUnique({
            where: { id },
            include: { memberProfile: true },
        });
    }
}
exports.AuthService = AuthService;
