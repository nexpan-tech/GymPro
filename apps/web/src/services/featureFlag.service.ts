import { api } from "@/lib/api";

/** Unwrap the `{ success, data }` envelope. */
function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

/** Effective feature flag for the caller's gym (override else global default). */
export interface EffectiveFlag {
  key: string;
  label: string;
  category: string | null;
  description: string | null;
  enabled: boolean;
  overridden: boolean;
}

export const featureFlagService = {
  /** GET /feature-flags/me — effective flags for the logged-in user's gym. */
  myFlags: async (): Promise<EffectiveFlag[]> => unwrap(await api.get("/feature-flags/me")) ?? [],
};
