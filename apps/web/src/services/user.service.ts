import { api } from "@/lib/api";
import type { ApiResponse } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

/** Roles a gym admin may provision inside their own gym. */
export type GymAssignableRole = "ADMIN" | "RECEPTIONIST" | "TRAINER" | "MEMBER";

export interface GymUser {
  id: string;
  name: string;
  email: string;
  role: string;
  gymId: string | null;
  branchId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: GymAssignableRole;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: GymAssignableRole;
  isActive?: boolean;
}

// ─── Service (GYM_ADMIN — scoped to caller's own gym by the backend) ─────────

export const userService = {
  /** GET /users — users within the caller's gym. */
  list: async (): Promise<GymUser[]> => {
    const res = await api.get<ApiResponse<GymUser[]>>("/users");
    return res.data.data;
  },

  /** POST /users — create a staff/member account in the caller's gym. */
  create: async (payload: CreateUserPayload): Promise<GymUser> => {
    const res = await api.post<ApiResponse<GymUser>>("/users", payload);
    return res.data.data;
  },

  /** PUT /users/:id — update name/email/role/active state. */
  update: async (id: string, payload: UpdateUserPayload): Promise<GymUser> => {
    const res = await api.put<ApiResponse<GymUser>>(`/users/${id}`, payload);
    return res.data.data;
  },

  /** Convenience toggle built on top of update. */
  setActive: async (id: string, isActive: boolean): Promise<GymUser> => {
    return userService.update(id, { isActive });
  },
};
