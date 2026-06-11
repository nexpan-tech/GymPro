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

const COLORS = ["#767676", "#767676", "#e73725"];

export default function PaymentStatusChart({
  data = defaultData,
}: PaymentStatusChartProps) {
  return (
    <Card className="rounded-3xl border border-border bg-white/95 p-6 shadow-xl dark:border-border dark:bg-muted">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground dark:text-white">
          Payment Status
        </h3>
        <p className="text-sm text-muted-foreground">
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
              border: "1px solid rgba(143,143,143,0.15)",
              backgroundColor: "rgba(1,0,0,0.95)",
              color: "#fff",
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {data.map((item, index) => (
          <div
            key={item.name}
            className="rounded-xl bg-muted p-3 text-center dark:bg-muted"
          >
            <div className="mb-2 flex items-center justify-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[index] }}
              />
              <span className="text-xs text-muted-foreground">
                {item.name}
              </span>
            </div>

            <p className="text-lg font-bold text-foreground dark:text-white">
              {item.value}%
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}