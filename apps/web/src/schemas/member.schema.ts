import * as z from "zod";

export const memberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  age: z.number().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
});