// apps/web/src/components/dashboard/PaymentStatusChart.tsx

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { Card } from "@/components/ui/Card";

interface PaymentStatusData {
  name: string;
  value: number;
}

interface PaymentStatusChartProps {
  data?: PaymentStatusData[];
}

const defaultData: PaymentStatusData[] = [
  { name: "Paid", value: 82 },
  { name: "Pending", value: 14 },
  { name: "Overdue", value: 4 },
];

const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

export default function PaymentStatusChart({
  data = defaultData,
}: PaymentStatusChartProps) {
  return (
    <Card className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Payment Status
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Collection breakdown
        </p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              borderRadius: "16px",
              border: "1px solid rgba(148,163,184,0.15)",
              backgroundColor: "rgba(15,23,42,0.95)",
              color: "#fff",
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {data.map((item, index) => (
          <div
            key={item.name}
            className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/50"
          >
            <div className="mb-2 flex items-center justify-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[index] }}
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {item.name}
              </span>
            </div>

            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {item.value}%
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}