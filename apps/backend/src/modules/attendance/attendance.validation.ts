import { z } from "zod";

/**
 * Validate check-in request
 */
export const checkInSchema = z.object({
  memberId: z.string().uuid(),
  date: z.string().optional(), // fallback = today
});