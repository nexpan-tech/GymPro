import { apiClient } from './client';
import { unwrapListResponse } from '../lib/api-response';

export interface ProgressPhoto {
  id: string;
  imageUrl: string;
  // Backend fields (ProgressPhoto model): notes + takenAt.
  notes?: string | null;
  takenAt?: string;
  type?: string;
  memberId?: string;
  createdAt?: string;
}

export interface BodyMeasurement {
  id: string;
  weight?: number | null;
  bodyFatPercentage?: number | null;
  bmi?: number | null;
  chest?: number | null;
  waist?: number | null;
  hips?: number | null;
  arms?: number | null;
  thighs?: number | null;
  notes?: string | null;
  createdAt?: string;
  [key: string]: unknown;
}

export interface Goal {
  id: string;
  title: string;
  description?: string | null;
  targetDate?: string | null;
  isCompleted: boolean;
  createdAt?: string;
}

export async function getMyProgressPhotos(): Promise<ProgressPhoto[]> {
  const res = await apiClient.get('/progress/photos');
  return unwrapListResponse<ProgressPhoto>(res);
}

export async function deleteProgressPhoto(id: string): Promise<void> {
  await apiClient.delete(`/progress/photos/${id}`);
}

export async function getBodyMeasurements(): Promise<BodyMeasurement[]> {
  // Backend exposes the member's own measurements at /progress/measurements/me.
  const res = await apiClient.get('/progress/measurements/me');
  return unwrapListResponse<BodyMeasurement>(res);
}

export async function getGoals(): Promise<Goal[]> {
  const res = await apiClient.get('/goals');
  return unwrapListResponse<Goal>(res);
}
