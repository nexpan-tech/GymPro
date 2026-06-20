import { z } from "zod";

export const createPlanSchema = z.object({
  name: z.string().min(1).max(60),
  description: z.string().max(300).optional(),
  interval: z.enum(["MONTHLY", "YEARLY"]),
  price: z.number().min(0).max(10_000_000),
  maxMembers: z.number().int().min(1).max(1_000_000).optional(),
  maxBranches: z.number().int().min(1).max(10_000).optional(),
  maxStaff: z.number().int().min(1).max(100_000).optional(),
});

export const updatePlanSchema = createPlanSchema.partial().extend({
  isActive: z.boolean().optional(),
  // allow clearing caps to "unlimited"
  maxMembers: z.number().int().min(1).max(1_000_000).nullable().optional(),
  maxBranches: z.number().int().min(1).max(10_000).nullable().optional(),
  maxStaff: z.number().int().min(1).max(100_000).nullable().optional(),
});

export const assignPlanSchema = z.object({
  planId: z.string().min(1),
  trialDays: z.number().int().min(0).max(365).optional(),
  autoRenew: z.boolean().optional(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type AssignPlanInput = z.infer<typeof assignPlanSchema>;
