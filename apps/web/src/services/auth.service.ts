import api from "@/lib/axios";

export const authService = {
  login: async (data: any) => {
    const res = await api.post("/auth/login", data);
    return res.data;
  },

  registerGym: async (data: any) => {
    const res = await api.post("/auth/register-gym", data);
    return res.data;
  },

  getProfile: async () => {
    const res = await api.get("/auth/profile");
    return res.data;
  },

  // ✅ ADD THIS
  forgotPassword: async (email: string) => {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  },
};