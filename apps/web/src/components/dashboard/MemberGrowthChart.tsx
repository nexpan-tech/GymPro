// apps/web/src/components/dashboard/MemberGrowthChart.tsx

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Card } from "@/components/ui/Card";

interface MemberGrowthData {
  month: string;
  members: number;
}

interface MemberGrowthChartProps {
  data?: MemberGrowthData[];
}

const defaultData: MemberGrowthData[] = [
  { month: "Jan", members: 120 },
  { month: "Feb", members: 145 },
  { month: "Mar", members: 172 },
  { month: "Apr", members: 198 },
  { month: "May", members: 224 },
  { month: "Jun", members: 248 },
];

export default function MemberGrowthChart({
  data = defaultData,
}: MemberGrowthChartProps) {
  return (
    <Card className="p-6 bg-white/95 dark:bg-slate-900/95 border border-slate-200/70 dark:border-slate-800 shadow-xl rounded-3xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Member Growth
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Total member growth over the last 6 months
        </p>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="memberGrowthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(148, 163, 184, 0.12)"
          />

          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            contentStyle={{
              borderRadius: "16px",
              border: "1px solid rgba(148,163,184,0.15)",
              backgroundColor: "rgba(15,23,42,0.95)",
              color: "#fff",
            }}
          />

          <Area
            type="monotone"
            dataKey="members"
            stroke="#6366f1"
            strokeWidth={3}
            fill="url(#memberGrowthGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}