import { z } from "zod";

const mealType = z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK", "PRE_WORKOUT", "POST_WORKOUT"]);

const meal = z.object({
  mealType,
  title: z.string().min(1).max(120),
  calories: z.number().int().min(0).max(10000).optional(),
  protein: z.number().min(0).max(2000).optional(),
  carbs: z.number().min(0).max(2000).optional(),
  fats: z.number().min(0).max(2000).optional(),
  time: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
  order: z.number().int().min(0).optional(),
});

export const createPersonalDietSchema = z.object({
  title: z.string().min(1).max(120),
  category: z.string().max(40).optional(),
  tags: z.array(z.string().max(30)).max(12).optional(),
  notes: z.string().max(2000).optional(),
  isTemplate: z.boolean().optional(),
  dayOfWeek: z.string().max(12).optional(),
  meals: z.array(meal).max(40).optional(),
});

export const updatePersonalDietSchema = createPersonalDietSchema.partial();

export const setWaterSchema = z.object({
  glasses: z.number().int().min(0).max(40),
  date: z.string().datetime().optional(),
});

export type CreatePersonalDietInput = z.infer<typeof createPersonalDietSchema>;
export type UpdatePersonalDietInput = z.infer<typeof updatePersonalDietSchema>;
