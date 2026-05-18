import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60";

  const variantClasses = {
    primary:
      "bg-(--gradient-primary) text-white shadow-[0_12px_30px_rgba(79,70,229,0.28)] hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(79,70,229,0.36)] focus:ring-indigo-500/20",
    secondary:
      "border border-(--border) bg-(--surface-secondary) text-(--text-primary) hover:bg-(--surface-hover) focus:ring-slate-500/10",
    outline:
      "border border-(--border) bg-transparent text-(--text-primary) hover:bg-(--surface-hover) focus:ring-indigo-500/10",
    danger:
      "bg-red-600 text-white shadow-[0_12px_30px_rgba(239,68,68,0.25)] hover:bg-red-700 focus:ring-red-500/20",
    ghost:
      "text-(--text-secondary) hover:bg-(--surface-hover) hover:text-(--text-primary) focus:ring-slate-500/10",
  };

  const sizeClasses = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}