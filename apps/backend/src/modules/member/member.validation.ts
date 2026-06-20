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

  // Passive referral capture — optional code of an existing member who referred
  // this person. Validated server-side (same gym, not self, not duplicate).
  referralCode: z.string().min(3).max(24).optional(),
});

export const updateMemberSchema = createMemberSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
