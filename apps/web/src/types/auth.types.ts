import type { User } from "./user.types";

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

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<any>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}