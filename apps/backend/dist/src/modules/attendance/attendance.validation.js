"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkInSchema = void 0;
const zod_1 = require("zod");
/**
 * Validate check-in request
 */
exports.checkInSchema = zod_1.z.object({
    memberId: zod_1.z.string().uuid(),
    date: zod_1.z.string().optional(), // fallback = today
});
