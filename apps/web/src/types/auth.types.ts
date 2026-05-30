// ─── Role Enum ───────────────────────────────────────────────────────────────

export type Role =
  | "SUPER_ADMIN"
  | "GYM_ADMIN"
  | "REGIONAL_MANAGER"
  | "BRANCH_MANAGER"
  | "ADMIN"
  | "RECEPTIONIST"
  | "TRAINER"
  | "MEMBER";

/** @deprecated Use Role instead */
export type UserRole = Role;

// ─── Core User Interface ──────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  gymId?: string | null;
  branchId?: string | null;
  avatar?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Auth Payloads ────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterGymPayload {
  gymName: string;
  ownerName: string;
  email: string;
  password: string;
  phone?: string;
}

// ─── Auth Responses ───────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: LoginResponse;
}

// ─── Auth State ───────────────────────────────────────────────────────────────

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

// ─── JWT ──────────────────────────────────────────────────────────────────────

export interface JWTPayload {
  sub: string;
  email: string;
  role: Role;
  gymId?: string;
  branchId?: string;
  iat: number;
  exp: number;
}
