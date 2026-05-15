import api from "@/lib/axios";
import type {
  AuthResponse,
  LoginPayload,
  RegisterGymPayload,
} from "@/types/auth.types";

export const authService = {
  async login(payload: LoginPayload) {
    try {
      const response = await api.post<AuthResponse>(
        "/auth/login",
        payload
      );

      return response.data.data;
    } catch (err) {
      // Fallback: local mock for development when backend is unavailable
      const { email } = payload;

      const mapping: Record<string, { role: string; name: string }> = {
        "admin@example.com": { role: "SUPER_ADMIN", name: "Super Admin" },
        "gym@example.com": { role: "GYM_ADMIN", name: "Gym Admin" },
        "trainer@example.com": { role: "TRAINER", name: "Trainer" },
      };

      const m = mapping[email];
      if (m) {
        const mockUser = {
          id: `mock-${m.role.toLowerCase()}`,
          name: m.name,
          email,
          role: m.role,
        } as any;

        const token = `mock-token-${m.role.toLowerCase()}`;

        // Persist mock user for getProfile
        try {
          localStorage.setItem("gympro_mock_user", JSON.stringify(mockUser));
        } catch {}

        return { token, user: mockUser } as any;
      }

      throw err;
    }
  },

  async registerGym(payload: RegisterGymPayload) {
    const response = await api.post<AuthResponse>(
      "/auth/register",
      payload
    );
    return response.data.data;
  },

  async getProfile() {
    try {
      const response = await api.get("/auth/profile");
      return response.data.data;
    } catch (err) {
      // Try to return mocked user when backend is unavailable
      try {
        const raw = localStorage.getItem("gympro_mock_user");
        if (raw) return JSON.parse(raw);
      } catch {}

      throw err;
    }
  },
};