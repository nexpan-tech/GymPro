import { useEffect, useState } from "react";
import { analyticsService } from "@/services/analytics.service";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    analyticsService.getDashboardAnalytics().then(setData);
  }, []);

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