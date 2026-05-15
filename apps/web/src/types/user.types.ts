export type UserRole =
  | "SUPER_ADMIN"
  | "GYM_ADMIN"
  | "TRAINER"
  | "RECEPTIONIST"
  | "MEMBER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  gymId?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Trainer extends User {
  specialization: string;
  experience: number;
}
