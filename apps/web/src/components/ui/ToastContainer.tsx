import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import { useToastStore, type Toast, type ToastType } from "@/hooks/useToast";

// ─── Icon & colour config ─────────────────────────────────────────────────────

const CONFIG: Record<
  ToastType,
  { icon: React.ReactNode; bar: string; container: string; title: string }
> = {
  success: {
    icon: <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />,
    bar: "bg-green-500",
    container:
      "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/60",
    title: "text-green-800 dark:text-green-300",
  },
  error: {
    icon: <XCircle className="h-5 w-5 shrink-0 text-red-500" />,
    bar: "bg-red-500",
    container:
      "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/60",
    title: "text-red-800 dark:text-red-300",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />,
    bar: "bg-amber-500",
    container:
      "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/60",
    title: "text-amber-800 dark:text-amber-300",
  },
  info: {
    icon: <Info className="h-5 w-5 shrink-0 text-blue-500" />,
    bar: "bg-blue-500",
    container:
      "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/60",
    title: "text-blue-800 dark:text-blue-300",
  },
};

// ─── Single toast item ────────────────────────────────────────────────────────

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cfg = CONFIG[toast.type];

  // Trigger enter animation on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    if (toast.duration === 0) return;

    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, toast.duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.duration]);

  const handleDismiss = () => {
    setVisible(false);
    // Wait for exit animation before removing from store
    dismissTimerRef.current = setTimeout(() => onDismiss(toast.id), 300);
  };

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        "relative w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border shadow-lg transition-all duration-300",
        cfg.container,
        visible
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0",
      ].join(" ")}
    >
      {/* Progress bar */}
      {toast.duration > 0 && (
        <div className="absolute left-0 top-0 h-0.5 w-full overflow-hidden rounded-t-xl">
          <div
            className={`h-full ${cfg.bar} origin-left`}
            style={{
              animation: `shrink ${toast.duration}ms linear forwards`,
            }}
          />
        </div>
      )}

      <div className="flex items-start gap-3 p-4">
        {cfg.icon}
        <p className={`flex-1 text-sm font-medium leading-snug ${cfg.title}`}>
          {toast.message}
        </p>
        <button
          onClick={handleDismiss}
          className="ml-1 shrink-0 rounded-md p-0.5 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:hover:text-gray-200"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Container ────────────────────────────────────────────────────────────────

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismissToast);

  return (
    <>
      {/* Keyframe for the progress bar shrink animation */}
      <style>{`
        @keyframes shrink {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>

      <div
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </>
  );
}

export default ToastContainer;
