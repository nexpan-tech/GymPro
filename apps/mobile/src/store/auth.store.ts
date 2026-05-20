import { create } from "zustand";
import { authService } from "../services/auth.service";
import { storage } from "../lib/storage";
import type { LoginPayload, User } from "../types/auth.types";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;

  bootstrap: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: true,
  isAuthenticated: false,

  bootstrap: async () => {
    try {
      const token = await storage.getToken();

      if (!token) {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
        });
        return;
      }

      const user = await authService.me();

      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
      });
    } catch {
      await storage.removeToken();

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  },

  login: async (payload) => {
    const response = await authService.login(payload);

    const token = response.data.token;
    const user = response.data.user;

    await storage.setToken(token);

    set({
      user,
      token,
      isAuthenticated: true,
    });

    return user;
  },

  logout: async () => {
    await storage.removeToken();

    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },
}));