import * as z from "zod";

export const membershipSchema = z.object({
  memberId: z.string(),
  planName: z.string().min(2),
  startDate: z.string(),
  endDate: z.string(),
  price: z.number(),
});