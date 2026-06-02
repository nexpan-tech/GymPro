import { api } from "@/lib/api";
import type { ApiResponse } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Branch {
  id: string;
  gymId: string;
  name: string;
  code: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  users?: unknown[];
  members?: unknown[];
}

export interface CreateBranchPayload {
  name: string;
  code: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface UpdateBranchPayload extends Partial<CreateBranchPayload> {
  isActive?: boolean;
}

// ─── Service (gymId is derived from the JWT on the backend) ──────────────────

export const branchService = {
  /** GET /branches — branches for the caller's gym. */
  list: async (): Promise<Branch[]> => {
    const res = await api.get<ApiResponse<Branch[]>>("/branches");
    return res.data.data;
  },

  /** POST /branches — create a branch in the caller's gym. */
  create: async (payload: CreateBranchPayload): Promise<Branch> => {
    const res = await api.post<ApiResponse<Branch>>("/branches", payload);
    return res.data.data;
  },

  /** PUT /branches/:id — update a branch. */
  update: async (id: string, payload: UpdateBranchPayload): Promise<Branch> => {
    const res = await api.put<ApiResponse<Branch>>(`/branches/${id}`, payload);
    return res.data.data;
  },

  /** POST /branches/:id/assign-user — move a staff user to a branch. */
  assignUser: async (branchId: string, userId: string): Promise<unknown> => {
    const res = await api.post<ApiResponse<unknown>>(
      `/branches/${branchId}/assign-user`,
      { userId }
    );
    return res.data.data;
  },
};
