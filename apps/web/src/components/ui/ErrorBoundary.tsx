import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary] Caught error:", error, info);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <DefaultErrorFallback
          error={this.state.error}
          onReset={this.reset}
        />
      );
    }
    return this.props.children;
  }
}

// ─── Default inline fallback ─────────────────────────────────────────────────

interface DefaultErrorFallbackProps {
  error: Error;
  onReset: () => void;
}

function DefaultErrorFallback({ error, onReset }: DefaultErrorFallbackProps) {
  const isDev = import.meta.env.DEV;

  const handleDashboard = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex min-h-100 flex-col items-center justify-center rounded-xl border border-primary/40 bg-primary/10 p-8 text-center dark:border-primary/40 dark:bg-primary">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 dark:bg-primary">
        <AlertTriangle className="h-7 w-7 text-primary" />
      </div>

      <h2 className="mb-2 text-lg font-semibold text-primary">
        Something went wrong
      </h2>

      <p className="mb-1 max-w-sm text-sm text-primary">
        {isDev
          ? error.message
          : "An unexpected error occurred. Please try again or return to the dashboard."}
      </p>

      {isDev && error.stack && (
        <pre className="my-3 max-h-40 w-full max-w-lg overflow-auto rounded-lg bg-primary/10 p-3 text-left text-xs text-primary dark:bg-primary/15 dark:text-primary">
          {error.stack}
        </pre>
      )}

      <div className="mt-5 flex gap-3">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
        <button
          onClick={handleDashboard}
          className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-white px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 dark:border-primary/40 dark:bg-transparent dark:text-primary dark:hover:bg-primary"
        >
          <LayoutDashboard className="h-4 w-4" />
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

export default ErrorBoundary;
