"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGymSchema = exports.createGymSchema = void 0;
const zod_1 = require("zod");
exports.createGymSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    logo: zod_1.z.string().optional(),
});
exports.updateGymSchema = exports.createGymSchema.partial().extend({
    isActive: zod_1.z.boolean().optional(),
});
