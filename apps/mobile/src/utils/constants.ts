export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5050/api/v1';

export const SOCKET_URL = API_BASE_URL.replace('/api/v1', '');

export const TOKEN_KEYS = {
  ACCESS: 'accessToken',
  REFRESH: 'refreshToken',
  USER: 'userData',
} as const;
