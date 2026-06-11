// InsightCard — turns raw numbers into executive intelligence: a headline, a
// short "why / what to do" line, an optional metric, and an action. Used to make
// Analytics feel like advice, not a chart dump. Strict palette: tone separates
// meaning by treatment + icon, never by hue.
//   opportunity → red energy (act on upside)
//   warning     → solid red (needs attention)
//   win         → outlined red with check (celebrate)
//   neutral     → calm gray (context)
import { type ReactNode } from "react";
import { TrendingUp, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

export type InsightTone = "opportunity" | "warning" | "win" | "neutral";

interface InsightCardProps {
  tone?: InsightTone;
  title: string;
  description: string;
  /** Optional headline metric shown large on the right. */
  metric?: ReactNode;
  metricLabel?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

const toneMeta: Record<
  InsightTone,
  { icon: ReactNode; iconWrap: string; accent: string }
> = {
  opportunity: {
    icon: <TrendingUp />,
    iconWrap: "bg-primary/10 text-primary ring-1 ring-primary/25",
    accent: "before:bg-(image:--gradient-primary)",
  },
  warning: {
    icon: <AlertTriangle />,
    iconWrap: "bg-(image:--gradient-primary) text-white glow-red-sm",
    accent: "before:bg-(image:--gradient-primary)",
  },
  win: {
    icon: <CheckCircle2 />,
    iconWrap: "bg-primary/10 text-primary ring-1 ring-primary/30",
    accent: "before:bg-primary/40",
  },
  neutral: {
    icon: <Sparkles />,
    iconWrap: "bg-muted text-foreground ring-1 ring-border",
    accent: "before:bg-border",
  },
};

export default function InsightCard({
  tone = "neutral",
  title,
  description,
  metric,
  metricLabel,
  action,
  icon,
  className,
}: InsightCardProps) {
  const meta = toneMeta[tone];
  return (
    <div
      className={cn(
        "surface-card lift relative overflow-hidden p-5 pl-6",
        // Left energy rail.
        "before:pointer-events-none before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r-full",
        meta.accent,
        className
      )}
    >
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl [&_svg]:h-5 [&_svg]:w-5",
            meta.iconWrap
          )}
          aria-hidden="true"
        >
          {icon ?? meta.icon}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black tracking-tight text-(--text-primary)">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-(--text-secondary)">{description}</p>
          {action && <div className="mt-3">{action}</div>}
        </div>

        {metric !== undefined && (
          <div className="shrink-0 text-right">
            <p className="metric-number text-2xl text-(--text-primary)">{metric}</p>
            {metricLabel && (
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-(--text-muted)">
                {metricLabel}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
