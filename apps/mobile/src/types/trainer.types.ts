import type { User } from "./auth.types";

export interface TrainerProfile {
  id: string;
  gymId: string;
  userId: string;
  specialization?: string | null;
  experience?: number | null;
  bio?: string | null;
  certifications?: string[] | null;
  user?: User;
}

export interface AssignedMember {
  id: string;
  userId: string;
  gymId: string;
  trainerId: string;
  phone?: string | null;
  fitnessGoal?: string | null;
  user?: User;
}
