export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "GYM_ADMIN"
  | "TRAINER"
  | "RECEPTIONIST"
  | "MEMBER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  gymId?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}