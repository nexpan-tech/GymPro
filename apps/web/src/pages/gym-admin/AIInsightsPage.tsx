import { useEffect, useState } from "react";
import { Brain, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { aiService, type Forecast, type Insight } from "@/services/enterprise.service";

const METRIC_LABEL: Record<string, string> = {
  membershipGrowth: "Membership growth",
  revenueGrowth: "Revenue growth",
  attendanceForecast: "Attendance",
  leadConversionForecast: "Lead conversion",
  churnForecast: "Churn (next 30d)",
};
const TrendIcon = ({ d }: { d: string }) => d === "up" ? <TrendingUp className="h-4 w-4 text-muted-foreground" /> : d === "down" ? <TrendingDown className="h-4 w-4 text-primary" /> : <Minus className="h-4 w-4 text-(--text-secondary)" />;
const sevTone = (s: string) => (s === "warning" ? "warning" : s === "positive" ? "success" : "info");

export default function AIInsightsPage() {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([aiService.forecast().catch(() => []), aiService.insights().catch(() => [])])
      .then(([f, i]) => { setForecasts(f); setInsights(i); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Page title="AI Insights"><Skeleton height="h-64" /></Page>;

  return (
    <Page title="AI Insights" description="Rule-based forecasts and predictive insights from your gym's own data — no external AI.">
      <div className="space-y-6">
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-(--text-primary)"><Brain className="h-4 w-4 text-primary" /> Forecasts</h3>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {forecasts.map((f) => (
              <Card key={f.metric} variant="solid" className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-(--text-secondary)">{METRIC_LABEL[f.metric] ?? f.metric}</span>
                  <TrendIcon d={f.direction} />
                </div>
                <div className="mt-2 text-2xl font-bold text-(--text-primary)">{f.projected.toLocaleString("en-IN")}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-(--text-secondary)">
                  <span>{f.changePercent >= 0 ? "+" : ""}{f.changePercent}% · {f.unit}</span>
                  <Badge variant="default">conf {Math.round(f.confidence * 100)}%</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-(--text-primary)">Predictive insights</h3>
          <div className="space-y-3">
            {insights.map((ins) => (
              <Card key={ins.type} variant="solid" className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-(--text-primary)">{ins.title}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={sevTone(ins.severity)}>{ins.severity}</Badge>
                    <Badge variant="default">conf {Math.round(ins.confidence * 100)}%</Badge>
                  </div>
                </div>
                <p className="mt-1 text-sm text-(--text-secondary)">{ins.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
}
