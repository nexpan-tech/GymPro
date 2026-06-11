import type { ReactNode } from "react";
import clsx from "clsx";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "accent";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

// GymPro strict palette: differentiate by treatment, not by hue.
const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-muted text-muted-foreground ring-1 ring-border",
  success: "bg-card text-foreground ring-1 ring-primary/60",
  warning: "bg-muted text-muted-foreground ring-1 ring-border",
  danger: "bg-primary text-white ring-1 ring-primary",
  info: "bg-primary/10 text-primary ring-1 ring-primary/30",
  accent: "bg-primary/10 text-primary ring-1 ring-primary/30",
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export default function Badge({
  children,
  variant = "default",
  size = "md",
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full font-semibold",
        variantClasses[variant],
        sizeClasses[size]
      )}
    >
      {children}
    </span>
  );
}