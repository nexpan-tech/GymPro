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
  // Strict GymPro palette: type conveyed by icon + accent bar, never by hue.
  // Neutral states (success/warning) read gray; alerts (error/info) read red.
  success: {
    icon: <CheckCircle2 className="h-5 w-5 shrink-0 text-muted-foreground" />,
    bar: "bg-muted-foreground",
    container: "border-border bg-card",
    title: "text-foreground",
  },
  error: {
    icon: <XCircle className="h-5 w-5 shrink-0 text-primary" />,
    bar: "bg-primary",
    container: "border-primary/40 bg-card",
    title: "text-foreground",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 shrink-0 text-muted-foreground" />,
    bar: "bg-muted-foreground",
    container: "border-border bg-card",
    title: "text-foreground",
  },
  info: {
    icon: <Info className="h-5 w-5 shrink-0 text-primary" />,
    bar: "bg-primary",
    container: "border-primary/40 bg-card",
    title: "text-foreground",
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
        "relative w-90 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border shadow-lg transition-all duration-300",
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
          className="ml-1 shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
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
        className="fixed bottom-4 right-4 z-9999 flex flex-col gap-2"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </>
  );
}

export default ToastContainer;
