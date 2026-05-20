import type { User } from "./user.types";

export interface Member {
  id: string;

  gymId: string;
  userId: string;

  phone: string;

  gender?: string;
  dateOfBirth?: string;

  address?: string;

  height?: number;
  weight?: number;
  fitnessGoal?: string;

  trainerId?: string;

  createdAt?: string;
  updatedAt?: string;

  user?: User;
  trainer?: User;
}