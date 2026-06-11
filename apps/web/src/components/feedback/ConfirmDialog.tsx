import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "danger" | "default";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: ReactNode;
}

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger",
  isLoading = false,
  onConfirm,
  onCancel,
  icon,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-6 shadow-2xl dark:border-border dark:bg-muted">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary">
          {icon ?? <AlertTriangle className="h-6 w-6" />}
        </div>

        <h3 className="text-lg font-semibold text-foreground dark:text-white">
          {title}
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          {description}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted dark:border-border dark:text-muted-foreground dark:hover:bg-muted"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
              confirmVariant === "danger"
                ? "bg-primary hover:bg-primary"
                : "bg-primary hover:bg-primary"
            } disabled:opacity-50`}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}