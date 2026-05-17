import {
  createContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

import { authService } from "@/services/auth.service";
import { storage } from "@/lib/storage";
import { useAuthStore } from "@/store/auth.store";

import type {
  AuthContextType,
  LoginPayload,
} from "@/types/auth.types";
import type { User } from "@/types/user.types";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: PropsWithChildren) {
  const {
    user,
    token,
    isAuthenticated,
    setUser,
    setToken,
    logout: logoutAction,
  } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  async function refreshProfile() {
    const existingToken = storage.getToken();

    if (!existingToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await authService.getProfile();
      setUser(profile);
      setToken(existingToken);
    } catch {
      storage.removeToken();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(payload: LoginPayload) {
    const response = await authService.login(payload);

    const authToken = response.data.token;
    const authUser = response.data.user;

    storage.setToken(authToken);
    setToken(authToken);
    setUser(authUser);

    return authUser;
  }

  function logout() {
    storage.removeToken();
    logoutAction();
    window.location.href = "/login";
  }

  useEffect(() => {
    refreshProfile();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

