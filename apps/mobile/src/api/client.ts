import axios from 'axios';
import { API_BASE_URL, TOKEN_KEYS } from '../utils/constants';
import { getItem, saveItem, clearAll } from '../utils/storage';

// TEMP DIAGNOSTIC: confirm the resolved base URL on device (remove later).
console.log('MOBILE API_BASE_URL', API_BASE_URL);

/**
 * Minimal, dependency-free event emitter.
 *
 * Node's `events` module is not reliably available in the React Native /
 * Hermes runtime (`EventEmitter is not a constructor`), so we use a tiny
 * typed emitter instead. Currently used to broadcast SESSION_EXPIRED when a
 * token refresh fails, so the UI can route back to login.
 */
type AuthEventName = 'SESSION_EXPIRED';
type AuthListener = () => void;

class AuthEvents {
  private listeners: Partial<Record<AuthEventName, AuthListener[]>> = {};

  on(event: AuthEventName, listener: AuthListener): () => void {
    (this.listeners[event] ??= []).push(listener);
    return () => this.off(event, listener);
  }

  off(event: AuthEventName, listener: AuthListener): void {
    this.listeners[event] = (this.listeners[event] ?? []).filter(
      (l) => l !== listener,
    );
  }

  emit(event: AuthEventName): void {
    (this.listeners[event] ?? []).forEach((l) => l());
  }
}

export const authEvents = new AuthEvents();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Canonical client alias. The whole mobile app shares this single axios
 * instance — services import it as `api`, api modules import it as `apiClient`.
 */
export const api = apiClient;

// Request interceptor — attach access token
apiClient.interceptors.request.use(
  async (config) => {
    const accessToken = await getItem(TOKEN_KEYS.ACCESS);
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Track whether a token refresh is already in flight
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
}

// Response interceptor — handle 401 with token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await getItem(TOKEN_KEYS.REFRESH);

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post<{
        success?: boolean;
        data?: { accessToken?: string; token?: string };
        accessToken?: string;
        token?: string;
      }>(`${API_BASE_URL}/auth/refresh`, { refreshToken });

      // Backend wraps the payload in { success, data }. Unwrap, and accept
      // either `accessToken` or its `token` alias.
      const payload = response.data?.data ?? response.data;
      const newAccessToken = payload?.accessToken ?? payload?.token;

      if (!newAccessToken) {
        throw new Error('Refresh response did not contain an access token');
      }

      // NOTE: the backend does NOT rotate the refresh token on /auth/refresh,
      // so we keep the existing one rather than clobbering it with undefined.
      await saveItem(TOKEN_KEYS.ACCESS, newAccessToken);

      apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      processQueue(null, newAccessToken);
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await clearAll();
      authEvents.emit('SESSION_EXPIRED');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
