import { z } from "zod";

export const createDietPlanSchema = z.object({
  memberId: z.string().uuid(),
  goal: z.string().optional(),

  monday: z.string().optional(),
  tuesday: z.string().optional(),
  wednesday: z.string().optional(),
  thursday: z.string().optional(),
  friday: z.string().optional(),
  saturday: z.string().optional(),
  sunday: z.string().optional(),

  notes: z.string().optional(),
});

export const updateDietPlanSchema = createDietPlanSchema.partial();

export type CreateDietPlanInput = z.infer<typeof createDietPlanSchema>;
export type UpdateDietPlanInput = z.infer<typeof updateDietPlanSchema>;