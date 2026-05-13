import { z } from "zod";

export const createMemberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),

  phone: z.string().min(6),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),

  address: z.string().optional(),
  height: z.number().optional(),
  weight: z.number().optional(),
  fitnessGoal: z.string().optional(),

  trainerId: z.string().uuid().optional(),
});

export const updateMemberSchema = createMemberSchema.partial();

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;