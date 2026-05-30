/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useEffect,
  type PropsWithChildren,
} from "react";

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
    accessToken,
    isAuthenticated,
    isLoading,
    login: storeLogin,
    logout: storeLogout,
    initAuth,
    refreshToken,
  } = useAuthStore();

  async function login(payload: LoginPayload) {
    return storeLogin(payload);
  }

  function logout() {
    storeLogout();
    window.location.replace("/login");
  }

  async function refreshProfile() {
    await refreshToken();
  }

  // Boot: restore session from localStorage / validate JWT
  useEffect(() => {
    void initAuth();
  }, [initAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        // AuthContextType still exposes `token` — map from new field name
        token: accessToken,
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
