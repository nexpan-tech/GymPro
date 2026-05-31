/**
 * Returns the current wall-clock time in milliseconds since the Unix epoch.
 *
 * Uses the Performance API (available in Node 16+ and Bun) which avoids
 * system-clock skew during the process lifetime while still returning an
 * accurate absolute timestamp.
 *
 *   performance.timeOrigin  – Unix epoch ms at the moment the process started
 *   performance.now()       – ms elapsed since that origin (sub-ms precision)
 */
export function getCurrentTimestampMs(): number {
  return performance.timeOrigin + performance.now();
}
