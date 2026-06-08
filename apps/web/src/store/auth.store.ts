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

function statusOf(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status;
}

// Single-flight guard: React StrictMode double-mounts the AuthProvider in dev,
// which would fire two concurrent /auth/me calls. We share one in-flight promise
// so boot only ever hits the endpoint once.
let initInflight: Promise<void> | null = null;

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
        // Coalesce concurrent/duplicate boots (StrictMode) into one request.
        if (initInflight) return initInflight;

        initInflight = (async () => {
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
            } catch (err) {
              // Only force logout if the refresh was actually rejected (401).
              // On 429 / network / 5xx keep the session and let the user retry.
              if (statusOf(err) === 401) get().logout();
              else set({ isLoading: false });
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
          } catch (err) {
            // 401 → token genuinely invalid, clear session. Anything else
            // (429 rate-limit, offline, 5xx) → preserve the persisted session so
            // the UI doesn't bounce to /login in a loop; just stop loading.
            if (statusOf(err) === 401) {
              get().logout();
            } else {
              set({ isLoading: false });
            }
          }
        })();

        try {
          await initInflight;
        } finally {
          initInflight = null;
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
