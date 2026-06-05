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

  // Stage 2 — branch + health profile
  branchId: z.string().optional(),
  trainerId: z.string().uuid().optional(),

  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  healthNotes: z.string().optional(),
  injuryNotes: z.string().optional(),
  medicalConditions: z.string().optional(),
});

export const updateMemberSchema = createMemberSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
