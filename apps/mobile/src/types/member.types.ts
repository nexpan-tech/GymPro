import type { User } from "./auth.types";

export interface Member {
  id: string;
  gymId: string;
  userId: string;
  phone: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  height?: number | null;
  weight?: number | null;
  fitnessGoal?: string | null;
  trainerId?: string | null;
  user?: User;
  trainer?: User | null;
}