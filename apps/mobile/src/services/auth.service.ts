import { api } from "../lib/api";
import type { AuthResponse, LoginPayload, User } from "../types/auth.types";

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/login", payload);
    return res.data;
  },

  me: async (): Promise<User> => {
    const res = await api.get<{ success: boolean; data: User }>("/auth/me");
    return res.data.data;
  },
};