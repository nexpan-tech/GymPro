import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { featureFlagService } from "@/services/featureFlag.service";

/**
 * Per-gym feature gating for the logged-in user.
 *
 * Fail-open by design: a feature is treated as ENABLED unless there is an
 * explicit `enabled:false` for the user's gym. Super admins (no gymId) and any
 * failed/loading fetch also fail open, so flags can only ever HIDE optional
 * features — they never break access to something that should be available.
 */
export function useFeatureFlags() {
  const { user } = useAuth();
  const gymId = user?.gymId ?? null;
  const scoped = !!gymId; // only gym-scoped users have per-gym flags

  const { data, isLoading } = useQuery({
    queryKey: ["feature-flags", "me", gymId],
    queryFn: () => featureFlagService.myFlags(),
    enabled: scoped,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const disabled = useMemo(() => {
    const set = new Set<string>();
    for (const f of data ?? []) if (!f.enabled) set.add(f.key);
    return set;
  }, [data]);

  /** True unless the key is explicitly disabled for this user's gym. */
  const isEnabled = useCallback(
    (key?: string | null): boolean => {
      if (!key) return true; // nav items without a feature key are always shown
      if (!scoped) return true; // super-admin / no gym context → fail-open
      return !disabled.has(key);
    },
    [scoped, disabled],
  );

  return { isEnabled, isLoading };
}
