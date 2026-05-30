import { type ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/cn";
import { SkeletonKpi } from "./Skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChangeType = "up" | "down" | "neutral";
type KpiColor = "indigo" | "emerald" | "amber" | "sky" | "rose" | "violet";

interface KpiCardProps {
  title: string;
  value: string | number;
  /** Change percentage as a number, e.g. 12.5 for +12.5% */
  change?: number;
  changeType?: ChangeType;
  /** Prefix label for the change, e.g. "vs last month" */
  changeLabel?: string;
  icon?: ReactNode;
  color?: KpiColor;
  loading?: boolean;
  className?: string;
}

// ─── Color maps ───────────────────────────────────────────────────────────────

const iconBgClasses: Record<KpiColor, string> = {
  indigo: "bg-indigo-500/10 text-indigo-500",
  emerald: "bg-emerald-500/10 text-emerald-500",
  amber: "bg-amber-500/10 text-amber-500",
  sky: "bg-sky-500/10 text-sky-500",
  rose: "bg-rose-500/10 text-rose-500",
  violet: "bg-violet-500/10 text-violet-500",
};

const changeClasses: Record<ChangeType, { text: string; bg: string }> = {
  up: { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  down: { text: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" },
  neutral: { text: "text-(--text-secondary)", bg: "bg-(--surface-hover)" },
};

const ChangeIcon: Record<ChangeType, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function KpiCard({
  title,
  value,
  change,
  changeType = "neutral",
  changeLabel,
  icon,
  color = "indigo",
  loading = false,
  className,
}: KpiCardProps) {
  if (loading) {
    return <SkeletonKpi className={className} />;
  }

  const IconComponent = ChangeIcon[changeType];
  const changeStyle = changeClasses[changeType];
  const hasChange = change !== undefined;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[22px]",
        "border border-(--border) bg-(--glass-strong)",
        "p-6 shadow-(--shadow-md) backdrop-blur-xl",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-(--shadow-xl)",
        className
      )}
    >
      {/* Subtle top shimmer line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent"
        aria-hidden="true"
      />

      {/* Header row: title + icon */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-(--text-secondary)">{title}</p>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              iconBgClasses[color]
            )}
            aria-hidden="true"
          >
            <span className="h-5 w-5">{icon}</span>
          </div>
        )}
      </div>

      {/* Value */}
      <p className="mt-3 text-3xl font-black tracking-tight text-(--text-primary)">
        {value}
      </p>

      {/* Change badge */}
      {hasChange && (
        <div className="mt-3 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              changeStyle.bg,
              changeStyle.text
            )}
          >
            <IconComponent className="h-3 w-3" aria-hidden="true" />
            {Math.abs(change).toFixed(1)}%
          </span>
          {changeLabel && (
            <span className="text-xs text-(--text-muted)">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
