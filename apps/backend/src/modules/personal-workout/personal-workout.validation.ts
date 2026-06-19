import { z } from "zod";

const difficulty = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);

const exercise = z.object({
  exerciseId: z.string().optional(),
  name: z.string().min(1).max(120),
  sets: z.number().int().min(1).max(50).default(3),
  reps: z.string().min(1).max(40).default("10"),
  restSeconds: z.number().int().min(0).max(3600).optional(),
  notes: z.string().max(500).optional(),
  order: z.number().int().min(0).optional(),
});

export const createPersonalWorkoutSchema = z.object({
  title: z.string().min(1).max(120),
  category: z.string().max(40).optional(),
  difficulty: difficulty.optional(),
  tags: z.array(z.string().max(30)).max(12).optional(),
  notes: z.string().max(2000).optional(),
  isTemplate: z.boolean().optional(),
  scheduledDate: z.string().datetime().optional(),
  dayOfWeek: z.string().max(12).optional(),
  estMinutes: z.number().int().min(0).max(600).optional(),
  exercises: z.array(exercise).max(60).optional(),
});

export const updatePersonalWorkoutSchema = createPersonalWorkoutSchema.partial();

export const completePersonalWorkoutSchema = z.object({
  durationMinutes: z.number().int().min(0).max(600).optional(),
  notes: z.string().max(500).optional(),
});

export type CreatePersonalWorkoutInput = z.infer<typeof createPersonalWorkoutSchema>;
export type UpdatePersonalWorkoutInput = z.infer<typeof updatePersonalWorkoutSchema>;
