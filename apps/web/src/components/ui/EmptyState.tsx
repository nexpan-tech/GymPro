import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  /** Controls vertical padding; "page" for full-height centering on a page, "card" for inside a card */
  size?: "sm" | "md" | "lg" | "page";
  className?: string;
}

// ─── Size padding map ─────────────────────────────────────────────────────────

const sizePaddingClasses: Record<NonNullable<EmptyStateProps["size"]>, string> = {
  sm: "py-8",
  md: "py-12",
  lg: "py-16",
  page: "py-24",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmptyState({
  title,
  description,
  icon,
  action,
  size = "md",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizePaddingClasses[size],
        "px-6",
        className
      )}
      role="status"
      aria-label={title}
    >
      {/* Icon container */}
      {icon && (
        <div
          className={cn(
            "mb-4 flex items-center justify-center",
            "h-16 w-16 rounded-2xl",
            "bg-(--surface-secondary)",
            "text-(--text-muted)",
            "[&_svg]:h-8 [&_svg]:w-8"
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      {/* Text content */}
      <h3 className="text-base font-semibold text-(--text-primary)">{title}</h3>

      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-(--text-secondary)">
          {description}
        </p>
      )}

      {/* Optional CTA */}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
