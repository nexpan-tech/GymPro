import { type ReactNode } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div
        className={clsx(
          "w-full overflow-hidden rounded-2xl border border-(--glass-border) bg-(--glass) shadow-(--shadow-xl) backdrop-blur-xl",
          sizeClasses[size]
        )}
      >
        <div className="flex items-center justify-between border-b border-(--border) px-6 py-4">
          {title && (
            <h2 className="text-lg font-bold text-(--text-primary)">
              {title}
            </h2>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-(--text-secondary) transition hover:bg-(--surface-hover) hover:text-(--text-primary)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}