import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "primary";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Optional dot indicator before the label */
  dot?: boolean;
  className?: string;
}

// ─── Variant styles ───────────────────────────────────────────────────────────

// GymPro strict palette: differentiate by treatment, not by hue.
//   primary/info → soft red outline · success → white + red border (e.g. Paid)
//   warning      → neutral gray (e.g. Pending) · danger → solid red (e.g. Overdue)
const variantClasses: Record<BadgeVariant, { badge: string; dot: string }> = {
  default: {
    badge: "bg-muted text-muted-foreground border border-border",
    dot: "bg-muted-foreground",
  },
  primary: {
    badge: "bg-primary/10 text-primary border border-primary/30",
    dot: "bg-primary",
  },
  success: {
    badge: "bg-card text-foreground border border-primary/60",
    dot: "bg-primary",
  },
  warning: {
    badge: "bg-muted text-muted-foreground border border-border",
    dot: "bg-muted-foreground",
  },
  danger: {
    badge: "bg-primary text-white border border-primary",
    dot: "bg-white",
  },
  info: {
    badge: "bg-primary/10 text-primary border border-primary/30",
    dot: "bg-primary",
  },
};

// ─── Size styles ──────────────────────────────────────────────────────────────

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-xs",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className,
}: BadgeProps) {
  const styles = variantClasses[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        styles.badge,
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", styles.dot)}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
