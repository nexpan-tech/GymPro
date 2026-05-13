"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMemberSchema = exports.createMemberSchema = void 0;
const zod_1 = require("zod");
exports.createMemberSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    phone: zod_1.z.string().min(6),
    gender: zod_1.z.string().optional(),
    dateOfBirth: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    height: zod_1.z.number().optional(),
    weight: zod_1.z.number().optional(),
    fitnessGoal: zod_1.z.string().optional(),
    trainerId: zod_1.z.string().uuid().optional(),
});
exports.updateMemberSchema = exports.createMemberSchema.partial();
