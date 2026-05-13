"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUserById = exports.getUsers = exports.createUser = void 0;
const db_1 = require("../../config/db");
const password_1 = require("../../utils/password");
const roles_1 = require("../../constants/roles");
const createUser = async (gymId, payload) => {
    const passwordHash = await (0, password_1.hashPassword)(payload.password);
    return db_1.prisma.user.create({
        data: {
            gymId,
            name: payload.name,
            email: payload.email,
            passwordHash,
            role: payload.role || roles_1.ROLES.MEMBER,
        },
    });
};
exports.createUser = createUser;
const getUsers = async (gymId) => {
    return db_1.prisma.user.findMany({
        where: { gymId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getUsers = getUsers;
const getUserById = async (gymId, id) => {
    return db_1.prisma.user.findFirst({
        where: { id, gymId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            member: true,
        },
    });
};
exports.getUserById = getUserById;
const updateUser = async (gymId, id, payload) => {
    return db_1.prisma.user.updateMany({
        where: { id, gymId },
        data: payload,
    });
};
exports.updateUser = updateUser;
const deleteUser = async (gymId, id) => {
    return db_1.prisma.user.deleteMany({
        where: { id, gymId },
    });
};
exports.deleteUser = deleteUser;
