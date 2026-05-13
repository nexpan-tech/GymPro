"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMembershipSchema = exports.createMembershipSchema = void 0;
const zod_1 = require("zod");
exports.createMembershipSchema = zod_1.z.object({
    memberId: zod_1.z.string().uuid(),
    plan: zod_1.z.enum([
        "MONTHLY",
        "QUARTERLY",
        "HALF_YEARLY",
        "YEARLY",
    ]),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string(),
    amount: zod_1.z.number().positive(),
    paymentStatus: zod_1.z
        .enum(["PAID", "PENDING", "OVERDUE"])
        .optional(),
});
exports.updateMembershipSchema = exports.createMembershipSchema.partial();
