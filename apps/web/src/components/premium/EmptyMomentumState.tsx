// EmptyMomentumState — motivational empty state. Same shape as EmptyState but
// the copy is framed as an opportunity ("Start building...") instead of a dead
// end ("No data found"), with a halo'd icon and a primary CTA.
import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface EmptyMomentumStateProps {
  /** Motivational headline, e.g. "Start building your community". */
  title: string;
  /** One-line nudge toward the next action. */
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  size?: "sm" | "md" | "lg" | "page";
  className?: string;
}

const padding: Record<NonNullable<EmptyMomentumStateProps["size"]>, string> = {
  sm: "py-8",
  md: "py-12",
  lg: "py-16",
  page: "py-24",
};

export default function EmptyMomentumState({
  title,
  description,
  icon,
  action,
  size = "md",
  className,
}: EmptyMomentumStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center",
        padding[size],
        className
      )}
      role="status"
      aria-label={title}
    >
      {icon && (
        <div className="reveal-pop relative mb-5" aria-hidden="true">
          <span className="absolute inset-0 -m-4 rounded-full bg-primary/10 blur-2xl" />
          <span className="absolute inset-0 -m-1.5 rounded-[30px] ring-1 ring-primary/15" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-[26px] bg-(image:--gradient-primary) text-white shadow-[0_14px_38px_rgba(231,55,37,0.32)] [&_svg]:h-9 [&_svg]:w-9">
            {icon}
          </div>
        </div>
      )}

      <h3 className="text-display text-xl text-(--text-primary)">{title}</h3>

      {description && (
        <p className="mt-2 max-w-md text-balance text-sm leading-relaxed text-(--text-secondary)">
          {description}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
