import { api } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProgressEntry {
  id: string;
  recordedAt: string;
  weight?: number | null;
  height?: number | null;
  bmi?: number | null;
  bodyFatPercentage?: number | null;
  muscleMass?: number | null;
  chest?: number | null;
  waist?: number | null;
  hips?: number | null;
  arms?: number | null;
  thighs?: number | null;
  notes?: string | null;
}

export interface CreateProgressEntry {
  recordedAt?: string;
  weight?: number;
  height?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
  bodyFatPercentage?: number;
  muscleMass?: number;
  notes?: string;
}

export type Trend = "UP" | "DOWN" | "FLAT";

export interface ChartSeries {
  metric: string;
  points: { date: string; value: number }[];
  trend: Trend;
  change: number;
}

export interface MetricSummary {
  latest: number;
  previous: number | null;
  first: number;
  changeSincePrevious: number | null;
  changeSinceFirst: number;
  monthlyAverage: number | null;
  trend: Trend;
}

export interface ProgressSummary {
  entryCount: number;
  firstEntryAt: string | null;
  lastEntryAt: string | null;
  consistencyScore: number;
  metrics: Record<string, MetricSummary>;
}

export interface ProgressGoal {
  id: string;
  title: string;
  metric?: string | null;
  startValue?: number | null;
  targetValue?: number | null;
  currentValue?: number | null;
  unit?: string | null;
  status: string;
  targetDate?: string | null;
  progressPercent: number;
}

export interface MonthlyReport {
  month: string;
  memberId: string;
  memberName: string | null;
  entriesThisMonth: number;
  consistencyScore: number;
  headline: Record<string, { latest: number | null; changeFromMonthStart: number | null }>;
  goals: ProgressGoal[];
  trainerNotes: { date: string; note: string }[];
}

function unwrap<T>(res: { data: { data?: T } | T }): T {
  return ((res.data as { data?: T }).data ?? res.data) as T;
}

/**
 * `scope` is "my" for the logged-in member, or "member/<memberId>" for a
 * trainer/admin viewing a specific member. Routes mirror each other on the API.
 */
export const progressService = {
  getTimeline: async (scope: string): Promise<ProgressEntry[]> =>
    unwrap<ProgressEntry[]>(await api.get(`/progress/${scope}/timeline`)) ?? [],

  getCharts: async (scope: string): Promise<ChartSeries[]> =>
    unwrap<ChartSeries[]>(await api.get(`/progress/${scope}/charts`)) ?? [],

  getSummary: async (scope: string): Promise<ProgressSummary> =>
    unwrap<ProgressSummary>(await api.get(`/progress/${scope}/summary`)),

  getMonthlyReport: async (scope: string): Promise<MonthlyReport> =>
    unwrap<MonthlyReport>(await api.get(`/progress/${scope}/monthly-report`)),

  createEntry: async (scope: string, data: CreateProgressEntry): Promise<ProgressEntry> =>
    unwrap<ProgressEntry>(await api.post(`/progress/${scope}`, data)),

  deleteEntry: async (id: string): Promise<void> => {
    await api.delete(`/progress/entries/${id}`);
  },

  listGoals: async (scope: string): Promise<ProgressGoal[]> =>
    unwrap<ProgressGoal[]>(await api.get(`/progress/${scope}/goals`)) ?? [],

  createGoal: async (
    scope: string,
    data: { title: string; metric?: string; startValue?: number; targetValue: number; currentValue?: number; unit?: string; targetDate?: string },
  ): Promise<ProgressGoal> =>
    unwrap<ProgressGoal>(await api.post(`/progress/${scope}/goals`, data)),

  updateGoal: async (
    scope: string,
    goalId: string,
    data: Record<string, unknown>,
  ): Promise<ProgressGoal> =>
    unwrap<ProgressGoal>(await api.patch(`/progress/${scope}/goals/${goalId}`, data)),

  deleteGoal: async (scope: string, goalId: string): Promise<void> => {
    await api.delete(`/progress/${scope}/goals/${goalId}`);
  },
};
