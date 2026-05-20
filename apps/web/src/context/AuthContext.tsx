/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
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

  const refreshProfile = useCallback(async () => {
    const existingToken = storage.getToken();

    if (!existingToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      setToken(existingToken);
      const profile = await authService.getProfile();
      setUser(profile);
    } catch {
      storage.removeToken();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [setToken, setUser]);

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
    window.location.replace("/login");
  }

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

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