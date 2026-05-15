import { useEffect, useState } from "react";
import { analyticsService } from "@/services/analytics.service";
import StatCard from "@/components/dashboard/StatCard";
import RevenueChart from "@/components/dashboard/RevenueChart";

export default function SuperAdminDashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    analyticsService.getDashboardAnalytics().then(setData);
  }, []);

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {data.stats.map((s: any, i: number) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      <RevenueChart data={data.revenue} />
    </div>
  );
}