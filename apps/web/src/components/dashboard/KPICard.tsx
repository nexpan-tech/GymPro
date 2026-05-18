// apps/web/src/components/dashboard/KPICard.tsx

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
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-900">{value}</h3>

          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>

        <div
          className={clsx(
            "flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br text-white shadow",
            color
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}

          <span
            className={clsx(
              "font-medium",
              isPositive ? "text-green-600" : "text-red-600"
            )}
          >
            {Math.abs(trend)}%
          </span>

          <span className="text-gray-500">vs last month</span>
        </div>
      )}
    </div>
  );
}