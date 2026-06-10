/**
 * Stage 10 — shared trend math for the (rule-based, no external LLM) AI engines.
 * Pure functions so they are unit-testable in isolation.
 */

export type TrendDirection = "up" | "down" | "flat";

export interface TrendResult {
  current: number;
  projected: number;
  changePercent: number;
  direction: TrendDirection;
  confidence: number; // 0–1, grows with the amount of history
}

/** Average month-over-month delta extrapolated one step forward. */
export function projectNext(series: number[]): TrendResult {
  const clean = series.map((n) => Number(n) || 0);
  if (clean.length === 0) return { current: 0, projected: 0, changePercent: 0, direction: "flat", confidence: 0.3 };
  const current = clean[clean.length - 1];
  if (clean.length === 1) return { current, projected: current, changePercent: 0, direction: "flat", confidence: 0.4 };

  let deltaSum = 0;
  for (let i = 1; i < clean.length; i++) deltaSum += clean[i] - clean[i - 1];
  const avgDelta = deltaSum / (clean.length - 1);
  const projected = Math.max(0, Math.round((current + avgDelta) * 100) / 100);

  const changePercent = current === 0 ? (projected > 0 ? 100 : 0) : Number((((projected - current) / current) * 100).toFixed(1));
  const direction: TrendDirection = avgDelta > 0.0001 ? "up" : avgDelta < -0.0001 ? "down" : "flat";
  // Confidence scales with history length, capped at 0.9 for rule-based.
  const confidence = Number(Math.min(0.9, 0.4 + clean.length * 0.08).toFixed(2));

  return { current, projected, changePercent, direction, confidence };
}

/** Bucket dated values into the last `months` YYYY-MM buckets (oldest→newest). */
export function monthlySeries(
  rows: { date: Date | string; value?: number }[],
  months = 6,
  now = new Date(),
): number[] {
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const totals: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0]));
  for (const r of rows) {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in totals) totals[key] += r.value ?? 1;
  }
  return keys.map((k) => totals[k]);
}
