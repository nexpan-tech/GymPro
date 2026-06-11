import { CheckCircle, AlertCircle, Info, XCircle } from "lucide-react";
import clsx from "clsx";

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  variant?: ToastVariant;
}

const variantStyles: Record<ToastVariant, string> = {
  success:
    "bg-muted text-muted-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border",
  error:
    "bg-primary/10 text-primary border-primary/40 dark:bg-primary/15 dark:text-primary dark:border-primary/40",
  warning:
    "bg-muted text-muted-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border",
  info:
    "bg-primary/10 text-primary border-primary/40 dark:bg-primary/15 dark:text-primary dark:border-primary/40",
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