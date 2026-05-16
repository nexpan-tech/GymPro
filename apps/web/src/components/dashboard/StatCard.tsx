import { Card } from "@/components/ui/Card";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
}: Props) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-gray-900">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="mt-2 text-3xl font-bold">{value}</h3>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
      )}
    </div>
  );
}