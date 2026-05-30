import { useCallback, useEffect, useState } from "react";
import { analyticsService } from "@/services/analytics.service";
import type { DashboardAnalytics } from "@/types/analytics.types";

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);

  const loadDashboardAnalytics = useCallback(async () => {
    const response = await analyticsService.getDashboard();
    setData(response.data ?? null);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDashboardAnalytics();
  }, [loadDashboardAnalytics]);

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Analytics</h1>

      <pre className="text-sm bg-gray-100 p-4 rounded">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}