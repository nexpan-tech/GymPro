import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "bg-[image:var(--gradient-primary)] text-white",
    "shadow-[0_12px_30px_rgba(79,70,229,0.28)]",
    "hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(79,70,229,0.36)]",
    "focus:ring-indigo-500/20",
    "disabled:shadow-none disabled:translate-y-0",
  ].join(" "),

  secondary: [
    "border border-(--border) bg-(--surface-secondary)",
    "text-(--text-primary)",
    "hover:bg-(--surface-hover)",
    "focus:ring-slate-500/10",
  ].join(" "),

  ghost: [
    "bg-transparent text-(--text-secondary)",
    "hover:bg-(--surface-hover) hover:text-(--text-primary)",
    "focus:ring-slate-500/10",
  ].join(" "),

  danger: [
    "bg-red-600 text-white",
    "shadow-[0_12px_30px_rgba(239,68,68,0.25)]",
    "hover:bg-red-700 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(239,68,68,0.32)]",
    "focus:ring-red-500/20",
    "disabled:shadow-none disabled:translate-y-0",
  ].join(" "),

  success: [
    "bg-emerald-600 text-white",
    "shadow-[0_12px_30px_rgba(16,185,129,0.25)]",
    "hover:bg-emerald-700 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(16,185,129,0.32)]",
    "focus:ring-emerald-500/20",
    "disabled:shadow-none disabled:translate-y-0",
  ].join(" "),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
};

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  iconLeft,
  iconRight,
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={cn(
        // Base
        "inline-flex items-center justify-center rounded-xl font-semibold",
        "transition-all duration-200",
        "focus:outline-none focus:ring-4",
        "disabled:cursor-not-allowed disabled:opacity-60",
        // Variant
        variantClasses[variant],
        // Size
        sizeClasses[size],
        // Full width
        fullWidth && "w-full",
        className
      )}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <Loader2
          className={cn("shrink-0 animate-spin", iconSizeClasses[size])}
          aria-hidden="true"
        />
      ) : iconLeft ? (
        <span className={cn("shrink-0", iconSizeClasses[size])} aria-hidden="true">
          {iconLeft}
        </span>
      ) : null}

      <span>{children}</span>

      {!loading && iconRight && (
        <span className={cn("shrink-0", iconSizeClasses[size])} aria-hidden="true">
          {iconRight}
        </span>
      )}
    </button>
  );
}
