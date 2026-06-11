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
    <Card className="p-6 bg-white/95 dark:bg-muted border border-border dark:border-border shadow-xl rounded-3xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground dark:text-white">
          Member Growth
        </h3>
        <p className="text-sm text-muted-foreground">
          Total member growth over the last 6 months
        </p>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="memberGrowthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e73725" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#e73725" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(143,143,143, 0.12)"
          />

          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "#767676" }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{ fontSize: 12, fill: "#767676" }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            contentStyle={{
              borderRadius: "16px",
              border: "1px solid rgba(143,143,143,0.15)",
              backgroundColor: "rgba(1,0,0,0.95)",
              color: "#fff",
            }}
          />

          <Area
            type="monotone"
            dataKey="members"
            stroke="#e73725"
            strokeWidth={3}
            fill="url(#memberGrowthGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}