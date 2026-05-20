import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import clsx from "clsx";

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number;
  color?: string;
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "from-blue-500 to-indigo-600",
}: KPICardProps) {
  const isPositive = trend === undefined ? true : trend >= 0;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-(--border) bg-(--glass-strong) p-6 shadow-(--shadow-md) backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-(--shadow-lg)">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-indigo-400/60 to-transparent" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-(--text-muted)">{title}</p>

          <h3 className="mt-2 truncate text-3xl font-black tracking-tight text-(--text-primary)">
            {value}
          </h3>

          {subtitle && (
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-(--text-secondary)">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={clsx(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-[0_14px_30px_rgba(79,70,229,0.28)] transition-transform duration-300 group-hover:scale-110",
            color
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {trend !== undefined && (
        <div className="mt-5 flex items-center gap-2 text-sm">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}

          <span
            className={clsx(
              "font-black",
              isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            )}
          >
            {Math.abs(trend)}%
          </span>

          <span className="text-(--text-muted)">vs last month</span>
        </div>
      )}
    </div>
  );
}

