// MetricCard — premium KPI tile (the evolution of KpiCard). Scoreboard number,
// energy accent, hover spotlight, optional trend badge + inline sparkline.
// Strict palette: "energy" tiles carry the red accent, "neutral" stay calm.
import { type ReactNode, useRef } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/cn";
import { SkeletonKpi } from "@/components/ui/Skeleton";

type Trend = "up" | "down" | "flat";
type Tone = "energy" | "neutral";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  /** Signed change percentage, e.g. 12.5 → +12.5%. */
  change?: number;
  /** Forces the trend arrow/treatment; otherwise derived from `change`. */
  trend?: Trend;
  /** Context line next to the change, e.g. "vs last month". */
  changeLabel?: string;
  /** Optional mini sparkline series for momentum at a glance. */
  spark?: number[];
  tone?: Tone;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

const trendIcon: Record<Trend, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

function Sparkline({ data, tone }: { data: number[]; tone: Tone }) {
  if (data.length < 2) return null;
  const w = 96;
  const h = 30;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const stroke = tone === "energy" ? "var(--brand-red)" : "var(--text-muted)";
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      className="overflow-visible"
      aria-hidden="true"
    >
      <polyline
        points={pts.join(" ")}
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={pts[pts.length - 1].split(",")[0]}
        cy={pts[pts.length - 1].split(",")[1]}
        r={2.6}
        fill={stroke}
      />
    </svg>
  );
}

export default function MetricCard({
  label,
  value,
  icon,
  change,
  trend,
  changeLabel,
  spark,
  tone = "energy",
  loading = false,
  onClick,
  className,
}: MetricCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  if (loading) return <SkeletonKpi className={className} />;

  const resolvedTrend: Trend =
    trend ?? (change === undefined ? "flat" : change > 0 ? "up" : change < 0 ? "down" : "flat");
  const TrendIcon = trendIcon[resolvedTrend];
  const hasChange = change !== undefined;

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onClick={onClick}
      className={cn(
        "group surface-card spotlight lift relative overflow-hidden p-6",
        onClick && "press cursor-pointer",
        className
      )}
    >
      {/* Energy accent strip top-left on energy tiles. */}
      {tone === "energy" && (
        <span
          className="pointer-events-none absolute left-0 top-0 h-1 w-16 rounded-br-xl bg-(image:--gradient-primary)"
          aria-hidden="true"
        />
      )}

      {/* Header: label + icon tile */}
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{label}</p>
        {icon && (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 [&_svg]:h-5 [&_svg]:w-5",
              tone === "energy"
                ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                : "bg-muted text-foreground ring-1 ring-border"
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <p className="metric-number count-in mt-4 text-[2.5rem] text-(--text-primary)">
        {value}
      </p>

      {/* Footer: change badge + sparkline */}
      <div className="mt-3 flex items-end justify-between gap-3">
        {hasChange ? (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
                resolvedTrend === "down"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <TrendIcon className="h-3 w-3" aria-hidden="true" />
              {Math.abs(change!).toFixed(1)}%
            </span>
            {changeLabel && (
              <span className="text-xs font-medium text-(--text-muted)">{changeLabel}</span>
            )}
          </div>
        ) : changeLabel ? (
          <span className="text-xs font-medium text-(--text-muted)">{changeLabel}</span>
        ) : (
          <span />
        )}
        {spark && spark.length > 1 && <Sparkline data={spark} tone={tone} />}
      </div>
    </div>
  );
}
