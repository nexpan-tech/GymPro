import * as z from "zod";

export const paymentSchema = z.object({
  memberId: z.string(),
  amount: z.number(),
  method: z.enum(["cash", "card", "upi", "bank"]),
  status: z.enum(["paid", "pending", "failed"]),
  date: z.string(),
});