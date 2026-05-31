import { create } from 'zustand';
import { login as loginRequest, logout as logoutRequest } from '../api/auth.api';
import { getItem, saveItem, clearAll } from '../utils/storage';
import { TOKEN_KEYS } from '../utils/constants';
import type { LoginPayload, User } from '../types/auth.types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;

  /** Restore session from secure storage on app start / resume. */
  bootstrap: () => Promise<void>;
  /** Authenticate and persist tokens; returns the user for post-login routing. */
  login: (payload: LoginPayload) => Promise<User>;
  /** Best-effort server logout, then clear all local session state. */
  logout: () => Promise<void>;
  /** Update the cached user (e.g. after a profile edit) and persist it. */
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  loading: true,
  isAuthenticated: false,

  bootstrap: async () => {
    try {
      const [accessToken, rawUser] = await Promise.all([
        getItem(TOKEN_KEYS.ACCESS),
        getItem(TOKEN_KEYS.USER),
      ]);

      if (accessToken && rawUser) {
        const user = JSON.parse(rawUser) as User;
        set({
          user,
          accessToken,
          isAuthenticated: true,
          loading: false,
        });
        return;
      }

      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        loading: false,
      });
    } catch {
      await clearAll();
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  },

  login: async (payload) => {
    const { user, accessToken, refreshToken } = await loginRequest(
      payload.email,
      payload.password,
    );

    await Promise.all([
      saveItem(TOKEN_KEYS.ACCESS, accessToken),
      saveItem(TOKEN_KEYS.REFRESH, refreshToken),
      saveItem(TOKEN_KEYS.USER, JSON.stringify(user)),
    ]);

    set({
      user,
      accessToken,
      isAuthenticated: true,
      loading: false,
    });

    return user;
  },

  logout: async () => {
    try {
      const refreshToken = await getItem(TOKEN_KEYS.REFRESH);
      if (refreshToken) {
        // Ignore network/server errors — clear locally regardless.
        await logoutRequest(refreshToken).catch(() => undefined);
      }
    } finally {
      await clearAll();
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  },

  setUser: (user) => {
    set({ user });
    void saveItem(TOKEN_KEYS.USER, JSON.stringify(user));
  },
}));
