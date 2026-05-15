import { Card } from "@/components/ui/Card";

interface Props {
  title: string;
  value: string | number;
  change?: number;
}

export default function StatCard({ title, value, change }: Props) {
  return (
    <Card className="p-4 flex flex-col gap-2">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold">{value}</div>

      {typeof change === "number" && (
        <div
          className={`text-sm ${
            change >= 0 ? "text-green-500" : "text-red-500"
          }`}
        >
          {change >= 0 ? "+" : ""}
          {change}%
        </div>
      )}
    </Card>
  );
}