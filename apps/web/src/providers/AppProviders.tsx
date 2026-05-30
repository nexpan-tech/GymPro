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

// ─── QueryClient ──────────────────────────────────────────────────────────────
// Defined here so it is created once and shared across the app.
// Individual query options can still override retry / staleTime.

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000, // 30 seconds
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
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
            {children}
            <ToastContainer />
          </AuthProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default AppProviders;
