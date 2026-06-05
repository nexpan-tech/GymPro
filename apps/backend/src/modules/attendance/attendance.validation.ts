import { z } from "zod";

/** Member QR scan — body carries the scanned gymId. */
export const scanSchema = z.object({
  gymId: z.string().min(1),
});

/** Admin/receptionist manual check-in for a member. */
export const manualCheckInSchema = z.object({
  memberId: z.string().uuid(),
});

/** Member QR check-out — optional scanned gymId is validated against the member's gym. */
export const checkoutSchema = z.object({
  gymId: z.string().min(1).optional(),
});

export type ScanInput = z.infer<typeof scanSchema>;
export type ManualCheckInInput = z.infer<typeof manualCheckInSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
