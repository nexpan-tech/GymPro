import { z } from "zod";

// Positive-ish measurement; allow 0 to be omitted by clients sending undefined.
const positive = z.number().positive();

export const createProgressEntrySchema = z.object({
  recordedAt: z.string().datetime().optional(),
  weight: positive.max(700).optional(),
  height: positive.max(300).optional(),
  chest: positive.max(400).optional(),
  waist: positive.max(400).optional(),
  hips: positive.max(400).optional(),
  arms: positive.max(200).optional(),
  thighs: positive.max(200).optional(),
  bodyFatPercentage: z.number().min(0).max(100).optional(),
  muscleMass: positive.max(300).optional(),
  notes: z.string().max(2000).optional(),
});

export const createProgressGoalSchema = z.object({
  title: z.string().min(1).max(200),
  metric: z.string().max(60).optional(),
  startValue: z.number().optional(),
  targetValue: z.number(),
  currentValue: z.number().optional(),
  unit: z.string().max(20).optional(),
  targetDate: z.string().datetime().optional(),
});

export const updateProgressGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  metric: z.string().max(60).optional(),
  startValue: z.number().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  unit: z.string().max(20).optional(),
  targetDate: z.string().datetime().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
});

export type CreateProgressEntryInput = z.infer<typeof createProgressEntrySchema>;
export type CreateProgressGoalInput = z.infer<typeof createProgressGoalSchema>;
export type UpdateProgressGoalInput = z.infer<typeof updateProgressGoalSchema>;
