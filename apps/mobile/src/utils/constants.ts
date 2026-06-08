// ─── API / Socket configuration ──────────────────────────────────────────────
//
// EXPO_PUBLIC_API_URL is read at build/start time by Expo. It must point at the
// backend reachable FROM THE DEVICE running the app:
//
//   iOS Simulator:      http://localhost:5050/api/v1   (or 127.0.0.1)
//   Android emulator:   http://10.0.2.2:5050/api/v1    (10.0.2.2 = host loopback)
//   Expo Go (physical): http://<MAC_LAN_IP>:5050/api/v1  e.g. http://192.168.1.45:5050/api/v1
//
// A physical phone CANNOT reach localhost/127.0.0.1 (that's the phone itself),
// so Expo Go must use the Mac's LAN IP. After changing .env, restart with
// `npx expo start -c` so the new value is picked up.

const RAW_API_URL = process.env.EXPO_PUBLIC_API_URL?.trim();
const DEFAULT_API_URL = 'http://localhost:5050/api/v1';

/** Ensure the base URL ends in /api/v<n> exactly once (no trailing slash). */
function normalizeApiUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, '');
  return /\/api\/v\d+$/.test(trimmed) ? trimmed : `${trimmed}/api/v1`;
}

export const API_BASE_URL = normalizeApiUrl(RAW_API_URL || DEFAULT_API_URL);

// Socket.IO connects to the host root, NOT the /api/v1 path.
export const SOCKET_URL = API_BASE_URL.replace(/\/api\/v\d+$/, '');

// One-time dev diagnostics so a misconfigured URL is obvious in the logs.
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  if (!RAW_API_URL) {
    console.warn(
      `[GymPro] EXPO_PUBLIC_API_URL is not set — defaulting to ${DEFAULT_API_URL}. ` +
        `On a physical phone (Expo Go) set it to your Mac LAN IP in apps/mobile/.env, ` +
        `e.g. http://192.168.1.45:5050/api/v1, then restart with "npx expo start -c".`,
    );
  } else if (/localhost|127\.0\.0\.1/.test(API_BASE_URL)) {
    console.warn(
      `[GymPro] API base URL is ${API_BASE_URL} (localhost). This only works on the ` +
        `iOS simulator. A physical phone needs your Mac LAN IP; the Android emulator needs 10.0.2.2.`,
    );
  }
  console.log(`[GymPro] API base URL: ${API_BASE_URL}`);
  console.log(`[GymPro] Socket URL:   ${SOCKET_URL}`);
}

export const TOKEN_KEYS = {
  ACCESS: 'accessToken',
  REFRESH: 'refreshToken',
  USER: 'userData',
} as const;
