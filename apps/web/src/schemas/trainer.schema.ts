import * as z from "zod";

export const trainerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  specialization: z.string().optional(),
  experience: z.number().optional(),
});