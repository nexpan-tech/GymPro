export type UserRole =
  | "SUPER_ADMIN"
  | "GYM_ADMIN"
  | "ADMIN"
  | "REGIONAL_MANAGER"
  | "BRANCH_MANAGER"
  | "TRAINER"
  | "RECEPTIONIST"
  | "MEMBER";

export interface Gym {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  logo?: string | null;
  isActive?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  gymId?: string | null;
  avatar?: string | null;
  gym?: Gym | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Trainer extends User {
  specialization?: string;
  experience?: number;
}