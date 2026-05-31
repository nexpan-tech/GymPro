import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEYS } from './constants';

/**
 * Single storage module for the mobile app.
 *
 * - Native (iOS/Android): expo-secure-store (encrypted keychain/keystore).
 * - Web: localStorage fallback, since SecureStore is unavailable there.
 *
 * Only non-sensitive metadata and auth tokens are stored here. Tokens live in
 * SecureStore on device; the web fallback exists purely for Expo web preview.
 */

const isWeb = Platform.OS === 'web';

export async function saveItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    return globalThis.localStorage?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

export async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function clearAll(): Promise<void> {
  await Promise.all([
    deleteItem(TOKEN_KEYS.ACCESS),
    deleteItem(TOKEN_KEYS.REFRESH),
    deleteItem(TOKEN_KEYS.USER),
  ]);
}
