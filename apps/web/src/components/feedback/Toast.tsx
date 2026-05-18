import { CheckCircle, AlertCircle, Info, XCircle } from "lucide-react";
import clsx from "clsx";

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  variant?: ToastVariant;
}

const variantStyles: Record<ToastVariant, string> = {
  success:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  error:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  warning:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  info:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
};

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

export default function Toast({
  message,
  variant = "info",
}: ToastProps) {
  const Icon = icons[variant];

  return (
    <div
      className={clsx(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg",
        variantStyles[variant]
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}