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
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 dark:bg-gray-950">
      {/* Logo */}
      <div className="mb-10 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
          <span className="text-lg font-bold text-white">G</span>
        </div>
        <span className="text-xl font-bold text-gray-900 dark:text-white">GymPro</span>
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
          <rect x="60" y="54" width="40" height="12" rx="6" fill="#E5E7EB" />
          <rect x="20" y="44" width="16" height="32" rx="6" fill="#D1D5DB" />
          <rect x="8" y="50" width="16" height="20" rx="4" fill="#9CA3AF" />
          <rect x="124" y="44" width="16" height="32" rx="6" fill="#D1D5DB" />
          <rect x="136" y="50" width="16" height="20" rx="4" fill="#9CA3AF" />
          {/* Warning mark */}
          <circle cx="80" cy="28" r="18" fill="#FEE2E2" />
          <rect x="78" y="18" width="4" height="10" rx="2" fill="#EF4444" />
          <rect x="78" y="31" width="4" height="4" rx="2" fill="#EF4444" />
        </svg>
      </div>

      {/* Message */}
      <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
        Oops — something broke
      </h1>
      <p className="mb-2 max-w-sm text-center text-sm text-gray-500 dark:text-gray-400">
        {isDev && error?.message
          ? error.message
          : "GymPro encountered a critical error and could not recover automatically. Please reload the page."}
      </p>

      {isDev && error?.stack && (
        <pre className="my-4 max-h-48 w-full max-w-xl overflow-auto rounded-xl bg-gray-100 p-4 text-left text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
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
          className="text-sm text-gray-500 underline-offset-4 hover:text-gray-800 hover:underline dark:text-gray-400 dark:hover:text-gray-200"
        >
          Contact support
        </a>
      </div>

      <p className="mt-10 text-xs text-gray-400 dark:text-gray-600">
        GymPro &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}

export default GlobalErrorFallback;
