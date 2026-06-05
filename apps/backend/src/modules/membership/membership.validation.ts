import { z } from "zod";

export const createMembershipSchema = z.object({
  memberId: z.string().uuid(),

  // Preferred: assign a named plan; dates/amount derive from it when omitted.
  planId: z.string().optional(),

  // Legacy enum-based assignment (still supported).
  plan: z.enum(["MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"]).optional(),

  startDate: z.string().optional(),
  endDate: z.string().optional(),

  amount: z.number().nonnegative().optional(),

  paymentStatus: z.enum(["PAID", "PENDING", "OVERDUE"]).optional(),
});

export const updateMembershipSchema = z.object({
  plan: z.enum(["MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  amount: z.number().nonnegative().optional(),
  paymentStatus: z.enum(["PAID", "PENDING", "OVERDUE"]).optional(),
  status: z.enum(["ACTIVE", "EXPIRED", "FROZEN", "CANCELLED"]).optional(),
});

export const renewMembershipSchema = z.object({
  planId: z.string().optional(),
  startDate: z.string().optional(),
  amount: z.number().nonnegative().optional(),
  paymentStatus: z.enum(["PAID", "PENDING", "OVERDUE"]).optional(),
});

export const freezeMembershipSchema = z.object({
  freezeStartDate: z.string().optional(),
  freezeEndDate: z.string().optional(),
});

export const extendMembershipSchema = z.object({
  days: z.number().int().positive(),
});

export type CreateMembershipInput = z.infer<typeof createMembershipSchema>;
export type UpdateMembershipInput = z.infer<typeof updateMembershipSchema>;
export type RenewMembershipInput = z.infer<typeof renewMembershipSchema>;
export type FreezeMembershipInput = z.infer<typeof freezeMembershipSchema>;
export type ExtendMembershipInput = z.infer<typeof extendMembershipSchema>;
