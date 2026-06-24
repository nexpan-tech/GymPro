import { api } from "@/lib/api";
import type { ApiResponse } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GymAdminSummary {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface PlatformGym {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  logo?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // present on list (_count) and detail responses
  _count?: {
    users?: number;
    members?: number;
    payments?: number;
  };
  users?: GymAdminSummary[];
}

export interface CreateGymPayload {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  /** SaaS license plan assigned on creation (every gym gets one license). */
  planId?: string;
  trialDays?: number;
  adminName?: string;
  adminEmail?: string;
  adminPassword?: string;
}

export interface CreateGymResult {
  gym: PlatformGym;
  admin: GymAdminSummary | null;
}

export interface UpdateGymPayload {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  pricePerActiveMember?: number;
  isActive?: boolean;
}

// ─── Service (SUPER_ADMIN platform-level gym management) ─────────────────────

export const gymService = {
  /** GET /gyms — list every gym on the platform. */
  list: async (): Promise<PlatformGym[]> => {
    const res = await api.get<ApiResponse<PlatformGym[]>>("/gyms");
    return res.data.data;
  },

  /** GET /gyms/:id — full gym detail incl. admins + counts. */
  getById: async (id: string): Promise<PlatformGym> => {
    const res = await api.get<ApiResponse<PlatformGym>>(`/gyms/${id}`);
    return res.data.data;
  },

  /** POST /gyms — create a gym (and optionally its first admin). */
  create: async (payload: CreateGymPayload): Promise<CreateGymResult> => {
    const res = await api.post<ApiResponse<CreateGymResult>>("/gyms", payload);
    return res.data.data;
  },

  /** PATCH /gyms/:id — update gym profile. */
  update: async (id: string, payload: UpdateGymPayload): Promise<PlatformGym> => {
    const res = await api.patch<ApiResponse<PlatformGym>>(`/gyms/${id}`, payload);
    return res.data.data;
  },

  /** PATCH /gyms/:id/activate — reactivate a suspended gym. */
  activate: async (id: string): Promise<PlatformGym> => {
    const res = await api.patch<ApiResponse<PlatformGym>>(`/gyms/${id}/activate`);
    return res.data.data;
  },

  /** PATCH /gyms/:id/deactivate — suspend a gym. */
  deactivate: async (id: string): Promise<PlatformGym> => {
    const res = await api.patch<ApiResponse<PlatformGym>>(
      `/gyms/${id}/deactivate`
    );
    return res.data.data;
  },
};
