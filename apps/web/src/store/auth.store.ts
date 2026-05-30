import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/auth.types";
import type { LoginPayload } from "@/services/auth.service";
import { authService } from "@/services/auth.service";

// ─── JWT helpers ──────────────────────────────────────────────────────────────

function decodeJWT(token: string): { exp?: number } | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded?.exp) return true;
  // exp is in seconds; add a 30-second buffer
  return Date.now() / 1000 >= decoded.exp - 30;
}

// ─── State shape ──────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (credentials: LoginPayload) => Promise<User>;
  logout: () => void;
  setUser: (user: User | null) => void;
  refreshToken: () => Promise<void>;
  /** Called once on app boot to restore session from localStorage */
  initAuth: () => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      // ── setUser ────────────────────────────────────────────────────────────
      setUser: (user) =>
        set({
          user,
          isAuthenticated: Boolean(user),
        }),

      // ── login ─────────────────────────────────────────────────────────────
      login: async (credentials) => {
        const response = await authService.login(credentials);

        // authService.login returns ApiResponse<AuthTokens>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = response.data as any;
        const accessToken: string = data.accessToken ?? data.token ?? "";
        const user = data.user as User;

        // authService already writes to localStorage; keep store in sync
        set({ user, accessToken, isAuthenticated: true, isLoading: false });
        return user;
      },

      // ── logout ────────────────────────────────────────────────────────────
      logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      // ── refreshToken ──────────────────────────────────────────────────────
      refreshToken: async () => {
        try {
          const response = await authService.refreshToken();
          const newToken = response.data.accessToken;
          set({ accessToken: newToken });
        } catch {
          // Refresh failed — clear session
          get().logout();
        }
      },

      // ── initAuth ──────────────────────────────────────────────────────────
      initAuth: async () => {
        set({ isLoading: true });

        const storedToken =
          localStorage.getItem("accessToken") ?? get().accessToken;

        if (!storedToken) {
          set({ isLoading: false, isAuthenticated: false, user: null, accessToken: null });
          return;
        }

        if (isTokenExpired(storedToken)) {
          // Attempt silent refresh before giving up
          const refreshToken = localStorage.getItem("refreshToken");
          if (!refreshToken) {
            get().logout();
            return;
          }
          try {
            await get().refreshToken();
          } catch {
            get().logout();
            return;
          }
        }

        // Token is valid — fetch the current profile
        try {
          const profileResponse = await authService.getProfile();
          // ApiResponse<User> — extract .data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const user = (profileResponse as any).data ?? profileResponse;
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: "gympro-auth",
      // Only persist the parts we need across page reloads; isLoading must
      // always start fresh so that initAuth drives the loading state.
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
