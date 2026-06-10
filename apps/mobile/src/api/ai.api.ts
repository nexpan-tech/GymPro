import { apiClient } from './client';
import { unwrapListResponse } from '../lib/api-response';

export interface Recommendation {
  title: string;
  description: string;
  confidence: number;
  category: 'WORKOUT' | 'DIET' | 'ENGAGEMENT' | 'RENEWAL' | 'CHALLENGE';
}

export interface Nudge {
  title: string;
  message: string;
  confidence: number;
}

export async function getMyRecommendations(): Promise<Recommendation[]> {
  return unwrapListResponse<Recommendation>(await apiClient.get('/ai/me/recommendations'));
}

export async function getMyNudges(): Promise<Nudge[]> {
  return unwrapListResponse<Nudge>(await apiClient.get('/ai/me/nudges'));
}
