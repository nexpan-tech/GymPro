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
      {/* Icon container — premium concentric red halo */}
      {icon && (
        <div className="relative mb-5 reveal-pop" aria-hidden="true">
          <span className="absolute inset-0 -m-3 rounded-full bg-primary/5 blur-xl" />
          <div
            className={cn(
              "relative flex items-center justify-center",
              "h-20 w-20 rounded-[26px]",
              "bg-primary/10 ring-1 ring-primary/20 text-primary",
              "[&_svg]:h-9 [&_svg]:w-9"
            )}
          >
            {icon}
          </div>
        </div>
      )}

      {/* Text content */}
      <h3 className="text-display text-xl text-(--text-primary)">{title}</h3>

      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-(--text-secondary) text-balance">
          {description}
        </p>
      )}

      {/* Optional CTA */}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
