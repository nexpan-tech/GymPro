import { z } from "zod";

export const createPlanSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  durationDays: z.number().int().positive(),
  price: z.number().nonnegative(),
  branchId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updatePlanSchema = createPlanSchema.partial();

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
