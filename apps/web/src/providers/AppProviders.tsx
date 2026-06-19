/**
 * AppProviders — single entry-point that composes every app-level provider.
 *
 * Layer order (outermost → innermost):
 *   ErrorBoundary (critical crash guard)
 *   → QueryClientProvider (TanStack Query)
 *   → ThemeProvider
 *   → AuthProvider
 *   → ToastContainer (rendered as sibling inside the tree)
 */
import type { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient } from "@tanstack/react-query";

import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { GlobalErrorFallback } from "@/components/ui/GlobalErrorFallback";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { ThemeProvider } from "./ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import { CelebrationProvider } from "@/components/premium/CelebrationProvider";

// ─── QueryClient ──────────────────────────────────────────────────────────────
// Defined here so it is created once and shared across the app.
// Individual query options can still override retry / staleTime.

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Never retry client errors (401/403/404/429) — retrying a forbidden or
      // rate-limited call just spams the server and the console. Retry other
      // failures (network/5xx) once.
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        // Never retry client errors (esp. 403/404/429) — retrying a forbidden or
        // rate-limited call just spams the server and the console.
        if (status && status >= 400 && status < 500) return false;
        // Retry transient failures (network / 5xx) up to twice.
        return failureCount < 2;
      },
      staleTime: 30_000, // 30 seconds
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ─── Provider tree ────────────────────────────────────────────────────────────

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <GlobalErrorFallback error={error} resetError={reset} />
      )}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <CelebrationProvider>
              {children}
            </CelebrationProvider>
            <ToastContainer />
          </AuthProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default AppProviders;
