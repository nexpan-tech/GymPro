import { RefreshCw } from "lucide-react";

interface GlobalErrorFallbackProps {
  error?: Error | null;
  resetError?: () => void;
}

export function GlobalErrorFallback({ error, resetError }: GlobalErrorFallbackProps) {
  const isDev = import.meta.env.DEV;

  const handleReload = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 dark:bg-muted">
      {/* Logo */}
      <div className="mb-10 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
          <span className="text-lg font-bold text-white">G</span>
        </div>
        <span className="text-xl font-bold text-foreground dark:text-white">GymPro</span>
      </div>

      {/* Illustration */}
      <div className="mb-8">
        <svg
          width="160"
          height="120"
          viewBox="0 0 160 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Barbell shape as error illustration */}
          <rect x="60" y="54" width="40" height="12" rx="6" fill="#e1e1e1" />
          <rect x="20" y="44" width="16" height="32" rx="6" fill="#cfcfcf" />
          <rect x="8" y="50" width="16" height="20" rx="4" fill="#767676" />
          <rect x="124" y="44" width="16" height="32" rx="6" fill="#cfcfcf" />
          <rect x="136" y="50" width="16" height="20" rx="4" fill="#767676" />
          {/* Warning mark */}
          <circle cx="80" cy="28" r="18" fill="#fdecea" />
          <rect x="78" y="18" width="4" height="10" rx="2" fill="#e73725" />
          <rect x="78" y="31" width="4" height="4" rx="2" fill="#e73725" />
        </svg>
      </div>

      {/* Message */}
      <h1 className="mb-3 text-2xl font-bold text-foreground dark:text-white">
        Oops — something broke
      </h1>
      <p className="mb-2 max-w-sm text-center text-sm text-muted-foreground">
        {isDev && error?.message
          ? error.message
          : "GymPro encountered a critical error and could not recover automatically. Please reload the page."}
      </p>

      {isDev && error?.stack && (
        <pre className="my-4 max-h-48 w-full max-w-xl overflow-auto rounded-xl bg-muted p-4 text-left text-xs text-foreground dark:bg-muted dark:text-muted-foreground">
          {error.stack}
        </pre>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
        <button
          onClick={handleReload}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reload page
        </button>
        <a
          href="mailto:support@gympro.io"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline dark:text-muted-foreground dark:hover:text-muted-foreground"
        >
          Contact support
        </a>
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        GymPro &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}

export default GlobalErrorFallback;
