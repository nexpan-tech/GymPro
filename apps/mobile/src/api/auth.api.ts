import { apiClient } from './client';
import { unwrapApiResponse } from '../lib/api-response';
import type { User } from '../types/auth.types';

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await apiClient.post('/auth/login', { email, password });
  // Backend returns { success, message, data: { user, token, accessToken, refreshToken } }
  return unwrapApiResponse<LoginResponse>(res);
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}

export async function refreshAuth(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken?: string }> {
  const res = await apiClient.post('/auth/refresh', { refreshToken });
  // Backend returns { success, data: { accessToken, token } } and does NOT
  // rotate the refresh token.
  const data = unwrapApiResponse<{ accessToken?: string; token?: string }>(res);
  const accessToken = data.accessToken ?? data.token;
  if (!accessToken) {
    throw new Error('Refresh response did not contain an access token');
  }
  return { accessToken };
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get('/auth/me');
  return unwrapApiResponse<User>(res);
}
