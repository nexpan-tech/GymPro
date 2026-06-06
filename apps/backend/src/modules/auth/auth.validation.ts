import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  // Gym ids are CUIDs (Gym.id @default(cuid())), NOT UUIDs — validating as
  // uuid here rejected every real gymId. Accept any non-empty id string.
  gymId: z.string().min(1).optional(),
  role: z.enum([
  "SUPER_ADMIN",
  "REGIONAL_MANAGER",
  "BRANCH_MANAGER",
  "ADMIN",
  "RECEPTIONIST",
  "TRAINER",
  "MEMBER",
]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerGymSchema = z.object({
  gymName: z.string().min(2),
  ownerName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterGymInput = z.infer<typeof registerGymSchema>;