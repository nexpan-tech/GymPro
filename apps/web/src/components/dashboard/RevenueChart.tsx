import { Card } from "@/components/ui/Card";

interface RevenueItem {
  month: string;
  revenue: number;
}

interface RevenueChartProps {
  data?: RevenueItem[];
}

export default function RevenueChart({
  data = [],
}: RevenueChartProps) {
  const safeData = Array.isArray(data) ? data : [];

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">
        Revenue Overview
      </h3>

      {safeData.length === 0 ? (
        <div className="py-10 text-center text-gray-500">
          No revenue data available
        </div>
      ) : (
        <div className="space-y-3">
          {safeData.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800"
            >
              <span>{item.month}</span>
              <span className="font-semibold">
                ₹{item.revenue.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}