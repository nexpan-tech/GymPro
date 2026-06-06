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

export const createDietCompletionSchema = z.object({
  // Optional for ADMIN/TRAINER logging on behalf of a member; ignored for MEMBER
  // (their own member record is always used).
  memberId: z.string().uuid().optional(),
  dietPlanId: z.string().uuid(),
  dietMealId: z.string().uuid().optional(),
  dayOfWeek: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateDietPlanInput = z.infer<typeof createDietPlanSchema>;
export type UpdateDietPlanInput = z.infer<typeof updateDietPlanSchema>;
export type CreateDietCompletionInput = z.infer<typeof createDietCompletionSchema>;