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

export interface MemberProfile extends Member {
  profileImageUrl?: string | null;
  emergencyContact?: string | null;
  medicalNotes?: string | null;
}

export interface MemberStats {
  totalWorkouts: number;
  attendanceThisMonth: number;
  currentStreak: number;
  longestStreak: number;
  weightProgress?: number | null;
  goalsCompleted: number;
}

export interface MembershipInfo {
  id: string;
  memberId: string;
  planId: string;
  planName: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "PENDING";
  startDate: string;
  endDate: string;
  price: number;
  currency?: string;
}
