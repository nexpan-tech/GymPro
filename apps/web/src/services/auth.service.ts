import api from "@/lib/axios";
import type {
  AuthResponse,
  LoginPayload,
  RegisterGymPayload,
} from "@/types/auth.types";
import type { User } from "@/types/user.types";

export const authService = {
  login: async (data: LoginPayload): Promise<AuthResponse> => {
    const res = await api.post("/auth/login", data);
    return res.data;
  },

  registerGym: async (
    data: RegisterGymPayload
  ): Promise<AuthResponse> => {
    const res = await api.post("/auth/register-gym", data);
    return res.data;
  },

  getProfile: async (): Promise<User> => {
    const res = await api.get("/auth/me");
    return res.data.data;
  },

  forgotPassword: async (email: string): Promise<unknown> => {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  },
};

