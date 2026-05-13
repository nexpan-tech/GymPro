import { z } from "zod";

export const createMembershipSchema = z.object({
  memberId: z.string().uuid(),

  plan: z.enum([
    "MONTHLY",
    "QUARTERLY",
    "HALF_YEARLY",
    "YEARLY",
  ]),

  startDate: z.string(),
  endDate: z.string(),

  amount: z.number().positive(),

  paymentStatus: z
    .enum(["PAID", "PENDING", "OVERDUE"])
    .optional(),
});

export const updateMembershipSchema =
  createMembershipSchema.partial();

export type CreateMembershipInput = z.infer<
  typeof createMembershipSchema
>;
export type UpdateMembershipInput = z.infer<
  typeof updateMembershipSchema
>;