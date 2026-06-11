// ActionCard — a premium, clickable tile used for quick actions / navigation.
// Icon tile flips to red energy on hover; the whole card lifts. Renders as a
// <button> (onClick) so it stays keyboard-accessible.
import { type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface ActionCardProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  /** Compact vertical variant for horizontal action rails. */
  compact?: boolean;
  className?: string;
}

export default function ActionCard({
  icon,
  title,
  subtitle,
  onClick,
  compact = false,
  className,
}: ActionCardProps) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group lift press flex shrink-0 flex-col items-center gap-2.5 rounded-2xl border border-border bg-(--surface-solid) px-5 py-4 text-center",
          className
        )}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-all duration-200 group-hover:bg-(image:--gradient-primary) group-hover:text-white group-hover:ring-0 group-hover:glow-red-sm [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </span>
        <span className="whitespace-nowrap text-xs font-bold text-(--text-secondary) group-hover:text-(--text-primary)">
          {title}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group surface-card spotlight lift press flex w-full items-center gap-4 p-5 text-left",
        className
      )}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-all duration-200 group-hover:bg-(image:--gradient-primary) group-hover:text-white group-hover:ring-0 group-hover:glow-red-sm [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-(--text-primary)">{title}</span>
        {subtitle && (
          <span className="mt-0.5 block truncate text-xs text-(--text-muted)">{subtitle}</span>
        )}
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-(--text-muted) transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
    </button>
  );
}
