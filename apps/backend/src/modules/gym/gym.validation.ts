import { z } from "zod";

export const createGymSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  logo: z.string().optional(),

  // Legacy per-member price — retained for backward-compat, no longer used for
  // billing (license-based now). New gyms should pass `planId` instead.
  pricePerActiveMember: z.number().min(0).optional(),

  // SaaS license: the plan to assign on creation (every gym gets exactly one
  // license). Optional — if omitted, the cheapest active plan is auto-assigned.
  planId: z.string().min(1).optional(),
  trialDays: z.number().int().min(0).max(365).optional(),

  adminName: z.string().min(2).optional(),
  adminEmail: z.string().email().optional(),
  adminPassword: z.string().min(6).optional(),
});

export const updateGymSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  logo: z.string().optional(),
  pricePerActiveMember: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateGymInput = z.infer<typeof createGymSchema>;
export type UpdateGymInput = z.infer<typeof updateGymSchema>;