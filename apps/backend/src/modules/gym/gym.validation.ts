import { z } from "zod";

export const createGymSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  logo: z.string().optional(),
});

export const updateGymSchema = createGymSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateGymInput = z.infer<typeof createGymSchema>;
export type UpdateGymInput = z.infer<typeof updateGymSchema>;