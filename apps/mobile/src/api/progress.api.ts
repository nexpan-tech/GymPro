import { apiClient } from './client';
import { unwrapApiResponse, unwrapListResponse } from '../lib/api-response';

// Numeric progress only — GymPro does NOT store progress photos.

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

export type Trend = 'UP' | 'DOWN' | 'FLAT';

export interface MetricSummary {
  latest: number;
  first: number;
  previous: number | null;
  changeSinceFirst: number;
  changeSincePrevious: number | null;
  monthlyAverage: number | null;
  trend: Trend;
}

export interface ProgressSummary {
  entryCount: number;
  consistencyScore: number;
  firstEntryAt: string | null;
  lastEntryAt: string | null;
  metrics: Record<string, MetricSummary>;
}

export interface ProgressGoal {
  id: string;
  title: string;
  metric?: string | null;
  targetValue?: number | null;
  currentValue?: number | null;
  unit?: string | null;
  status: string;
  progressPercent: number;
}

// ── Self (member) ────────────────────────────────────────────────────────────
export async function getMyTimeline(): Promise<ProgressEntry[]> {
  return unwrapListResponse<ProgressEntry>(await apiClient.get('/progress/my/timeline'));
}
export async function getMySummary(): Promise<ProgressSummary> {
  return unwrapApiResponse<ProgressSummary>(await apiClient.get('/progress/my/summary'));
}
export async function getMyGoals(): Promise<ProgressGoal[]> {
  return unwrapListResponse<ProgressGoal>(await apiClient.get('/progress/my/goals'));
}
export async function createMyGoal(data: { title: string; targetValue: number; metric?: string; unit?: string; startValue?: number; currentValue?: number }): Promise<ProgressGoal> {
  return unwrapApiResponse<ProgressGoal>(await apiClient.post('/progress/my/goals', data));
}
export async function updateMyGoal(goalId: string, data: Record<string, unknown>): Promise<ProgressGoal> {
  return unwrapApiResponse<ProgressGoal>(await apiClient.patch(`/progress/my/goals/${goalId}`, data));
}
export async function deleteMyGoal(goalId: string): Promise<void> {
  await apiClient.delete(`/progress/my/goals/${goalId}`);
}
export async function createMyEntry(data: CreateProgressEntry): Promise<ProgressEntry> {
  return unwrapApiResponse<ProgressEntry>(await apiClient.post('/progress/my', data));
}

// ── Member (trainer/admin) ───────────────────────────────────────────────────
export async function getMemberTimeline(memberId: string): Promise<ProgressEntry[]> {
  return unwrapListResponse<ProgressEntry>(await apiClient.get(`/progress/member/${memberId}/timeline`));
}
export async function getMemberSummary(memberId: string): Promise<ProgressSummary> {
  return unwrapApiResponse<ProgressSummary>(await apiClient.get(`/progress/member/${memberId}/summary`));
}
export async function createMemberEntry(memberId: string, data: CreateProgressEntry): Promise<ProgressEntry> {
  return unwrapApiResponse<ProgressEntry>(await apiClient.post(`/progress/member/${memberId}`, data));
}
