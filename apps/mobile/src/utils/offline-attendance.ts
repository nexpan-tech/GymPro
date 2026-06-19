import { getItem, saveItem } from "./storage";
import { attendanceService } from "../services/attendance.service";

/**
 * Phase N — offline QR attendance queue.
 *
 * When a check-in / check-out scan can't reach the server (no network), it's
 * stored locally and replayed automatically when connectivity returns (on app
 * foreground or the next action). Duplicate-safe: at most one check-in and one
 * check-out per gym per day are ever queued, and the server's own idempotency
 * ("already checked in" / "attendance already completed" / "no active check-in")
 * is treated as a resolved sync rather than a failure.
 */

const QUEUE_KEY = "offline_attendance_queue_v1";

export interface PendingScan {
  id: string;
  action: "checkin" | "checkout";
  gymId: string;
  dayKey: string; // YYYY-MM-DD — used for per-day dedup
  createdAt: string;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function loadQueue(): Promise<PendingScan[]> {
  try {
    const raw = await getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as PendingScan[]) : [];
  } catch {
    return [];
  }
}

async function saveQueue(q: PendingScan[]): Promise<void> {
  await saveItem(QUEUE_KEY, JSON.stringify(q)).catch(() => undefined);
}

/** True if a request failed because the device is offline (no server response). */
export function isOfflineError(err: unknown): boolean {
  const e = err as { response?: unknown; code?: string; message?: string };
  if (e?.response) return false; // server answered → not an offline failure
  return e?.code === "ECONNABORTED" || /network|timeout/i.test(e?.message ?? "") || !e?.response;
}

/** Queue a scan for later sync. Deduped to one per action+gym+day. */
export async function enqueueScan(action: "checkin" | "checkout", gymId: string): Promise<PendingScan[]> {
  const q = await loadQueue();
  const dayKey = todayKey();
  if (q.some((s) => s.action === action && s.gymId === gymId && s.dayKey === dayKey)) return q;
  const next = [...q, { id: `${action}_${Date.now()}`, action, gymId, dayKey, createdAt: new Date().toISOString() }];
  await saveQueue(next);
  return next;
}

/**
 * Replay every queued scan. Items succeed, or resolve against the server's
 * idempotency, are removed; genuine offline failures stay queued for next time.
 */
export async function syncPending(): Promise<{ synced: number; remaining: number }> {
  const q = await loadQueue();
  if (q.length === 0) return { synced: 0, remaining: 0 };

  const keep: PendingScan[] = [];
  let synced = 0;

  for (const item of q) {
    try {
      if (item.action === "checkin") await attendanceService.scan(item.gymId);
      else await attendanceService.checkout({ gymId: item.gymId });
      synced += 1;
    } catch (err) {
      if (isOfflineError(err)) {
        keep.push(item); // still offline → retry later
      } else {
        // Server responded (e.g. "already checked in" / "completed" / "no active
        // check-in") → the desired state already holds; drop the item.
        synced += 1;
      }
    }
  }

  await saveQueue(keep);
  return { synced, remaining: keep.length };
}

export async function pendingCount(): Promise<number> {
  return (await loadQueue()).length;
}
