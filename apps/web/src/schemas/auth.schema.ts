import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(6, "Password is required"),
});

export const registerGymSchema = z.object({
  gymName: z.string().min(2, "Gym name is required"),
  ownerName: z.string().min(2, "Owner name is required"),
  email: z.email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterGymFormValues = z.infer<
  typeof registerGymSchema
>;
