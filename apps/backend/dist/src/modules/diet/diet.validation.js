"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDietPlanSchema = exports.createDietPlanSchema = void 0;
const zod_1 = require("zod");
exports.createDietPlanSchema = zod_1.z.object({
    memberId: zod_1.z.string().uuid(),
    goal: zod_1.z.string().optional(),
    monday: zod_1.z.string().optional(),
    tuesday: zod_1.z.string().optional(),
    wednesday: zod_1.z.string().optional(),
    thursday: zod_1.z.string().optional(),
    friday: zod_1.z.string().optional(),
    saturday: zod_1.z.string().optional(),
    sunday: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.updateDietPlanSchema = exports.createDietPlanSchema.partial();
