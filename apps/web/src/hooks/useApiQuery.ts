import {
  useQuery,
  type UseQueryOptions,
  type QueryKey,
} from "@tanstack/react-query";
import { useEffect } from "react";
import type { ApiResponse } from "@/lib/api";
import { useToastStore } from "@/hooks/useToast";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiQueryOptions<TData, TKey extends QueryKey = QueryKey> = Omit<
  UseQueryOptions<ApiResponse<TData>, Error, TData, TKey>,
  "select"
> & {
  /** Override the default error toast message */
  errorMessage?: string;
  /** Set to false to suppress the error toast (default: true) */
  showErrorToast?: boolean;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Thin wrapper around useQuery that:
 * - Automatically unwraps `ApiResponse<T>.data`
 * - Shows a toast on query error
 * - Returns a flat { data, isLoading, error, refetch } shape
 */
export function useApiQuery<TData, TKey extends QueryKey = QueryKey>({
  errorMessage,
  showErrorToast = true,
  ...options
}: ApiQueryOptions<TData, TKey>) {
  const showToast = useToastStore((s) => s.showToast);

  const query = useQuery<ApiResponse<TData>, Error, TData, TKey>({
    ...options,
    // Unwrap ApiResponse<T> → T
    select: (response) => response.data,
  });

  // Side-effect: show toast when error changes
  useEffect(() => {
    if (!query.error) return;

    const message =
      errorMessage ??
      (query.error instanceof Error
        ? query.error.message
        : "An unexpected error occurred.");

    if (showErrorToast) {
      showToast("error", message);
    }

    if (import.meta.env.DEV) {
      console.error("[useApiQuery] Query error:", query.error);
    }
  }, [query.error, errorMessage, showErrorToast, showToast]);

  return {
    /** Unwrapped data (ApiResponse<T>.data) — undefined while loading */
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    status: query.status,
  };
}
