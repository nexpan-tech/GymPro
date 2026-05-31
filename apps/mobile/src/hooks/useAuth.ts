import { useAuthStore } from '../stores/auth.store';

/**
 * Thin selector hook over the canonical auth store. Session bootstrap is owned
 * by the root layout (app/_layout.tsx), so this hook only exposes state +
 * actions and does not trigger its own bootstrap.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loading = useAuthStore((s) => s.loading);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);

  return { user, isAuthenticated, loading, login, logout, setUser };
}
