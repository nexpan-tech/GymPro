import {
  type ReactNode,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalSize = "sm" | "md" | "lg" | "xl";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
  /** Prevent closing on backdrop click */
  disableBackdropClose?: boolean;
  className?: string;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
  disableBackdropClose = false,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Keyboard — Escape closes the modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  // Prevent body scroll when open
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    // Focus trap: move focus into dialog
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const modal = (
    // Backdrop
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center",
        "bg-slate-950/60 backdrop-blur-sm"
      )}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-description" : undefined}
      onClick={!disableBackdropClose ? (e) => { if (e.target === e.currentTarget) onClose(); } : undefined}
    >
      {/* Panel */}
      <div
        ref={dialogRef}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl",
          "border border-(--glass-border) bg-(--glass-strong)",
          "shadow-(--shadow-xl) backdrop-blur-xl",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          sizeClasses[size],
          className
        )}
        // Stop click propagation so backdrop handler doesn't fire
        onClick={(e) => e.stopPropagation()}
      >
        {/* Shimmer top line */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent"
          aria-hidden="true"
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-(--border) px-6 py-4">
          <div className="min-w-0">
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-bold text-(--text-primary)"
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                id="modal-description"
                className="mt-0.5 text-sm text-(--text-secondary)"
              >
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className={cn(
              "shrink-0 rounded-xl p-2",
              "text-(--text-secondary) transition-colors",
              "hover:bg-(--surface-hover) hover:text-(--text-primary)",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            )}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-(--border) px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
