import { type ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/cn";
import { SkeletonKpi } from "./Skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChangeType = "up" | "down" | "neutral";
type KpiColor = "energy" | "neutral" | "steel" | "focus" | "rose" | "violet";

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
// Strict palette: an energetic soft-red accent tile, or a calm neutral tile.
// (We keep variety controlled so the board reads premium, not "all red".)

const iconBgClasses: Record<KpiColor, string> = {
  energy: "bg-primary/10 text-primary ring-1 ring-primary/20",
  neutral: "bg-muted text-foreground ring-1 ring-border",
  steel: "bg-muted text-foreground ring-1 ring-border",
  focus: "bg-primary/10 text-primary ring-1 ring-primary/20",
  rose: "bg-primary/10 text-primary ring-1 ring-primary/20",
  violet: "bg-primary/10 text-primary ring-1 ring-primary/20",
};

// Whether this KPI carries the red "energy" accent strip.
const accentColors: Record<KpiColor, boolean> = {
  energy: true, focus: true, rose: true, violet: true, neutral: false, steel: false,
};

const changeClasses: Record<ChangeType, { text: string; bg: string }> = {
  up: { text: "text-muted-foreground", bg: "bg-muted" },
  down: { text: "text-primary", bg: "bg-primary/10" },
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
  color = "energy",
  loading = false,
  className,
}: KpiCardProps) {
  if (loading) {
    return <SkeletonKpi className={className} />;
  }

  const IconComponent = ChangeIcon[changeType];
  const changeStyle = changeClasses[changeType];
  const hasChange = change !== undefined;
  const accent = accentColors[color];

  return (
    <div
      className={cn(
        "group surface-card lift press relative overflow-hidden p-6",
        className
      )}
    >
      {/* Energy accent — a short red strip top-left on "active" KPIs. */}
      {accent && (
        <span
          className="pointer-events-none absolute left-0 top-0 h-1 w-14 rounded-br-xl bg-(image:--gradient-primary)"
          aria-hidden="true"
        />
      )}
      {/* Corner glow on hover for depth. */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      {/* Header row: title + icon */}
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{title}</p>
        {icon && (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110",
              iconBgClasses[color]
            )}
            aria-hidden="true"
          >
            <span className="h-5 w-5">{icon}</span>
          </div>
        )}
      </div>

      {/* Value — scoreboard scale */}
      <p className="metric-number mt-4 text-[2.5rem] text-(--text-primary)">
        {value}
      </p>

      {/* Change badge */}
      {hasChange && (
        <div className="mt-3 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
              changeStyle.bg,
              changeStyle.text
            )}
          >
            <IconComponent className="h-3 w-3" aria-hidden="true" />
            {Math.abs(change).toFixed(1)}%
          </span>
          {changeLabel && (
            <span className="text-xs font-medium text-(--text-muted)">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
