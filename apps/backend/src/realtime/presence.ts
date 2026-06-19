/**
 * Phase L — in-memory presence registry.
 *
 * Tracks online / away / offline per user, ref-counted across a user's open
 * sockets (multiple tabs/devices). Presence broadcasts ride the gym room, so the
 * Socket.IO Redis adapter already fans them out across instances; the registry
 * itself is per-instance, which is correct for the single-backend deployment and
 * degrades gracefully (a user simply appears offline on instances they aren't
 * connected to). Never persisted — realtime only.
 */

export type PresenceStatus = "online" | "away" | "offline";

interface Entry {
  count: number;
  status: PresenceStatus;
  gymId: string | null;
}

const registry = new Map<string, Entry>();

/** A socket connected → bump the ref count and mark online. Returns the new status. */
export function addConnection(userId: string, gymId: string | null): PresenceStatus {
  const entry = registry.get(userId);
  if (entry) {
    entry.count += 1;
    entry.status = "online";
    entry.gymId = gymId ?? entry.gymId;
    return entry.status;
  }
  registry.set(userId, { count: 1, status: "online", gymId });
  return "online";
}

/** A socket disconnected → drop the ref count; offline when the last one closes. */
export function removeConnection(userId: string): PresenceStatus {
  const entry = registry.get(userId);
  if (!entry) return "offline";
  entry.count = Math.max(0, entry.count - 1);
  if (entry.count === 0) {
    entry.status = "offline";
  }
  return entry.status;
}

/** Client-driven away/active transitions (only meaningful while connected). */
export function setStatus(userId: string, status: "away" | "online"): PresenceStatus {
  const entry = registry.get(userId);
  if (!entry || entry.count === 0) return "offline";
  entry.status = status;
  return status;
}

export function getStatus(userId: string): PresenceStatus {
  return registry.get(userId)?.status ?? "offline";
}

export function getMany(userIds: string[]): Record<string, PresenceStatus> {
  const out: Record<string, PresenceStatus> = {};
  for (const id of userIds) out[id] = getStatus(id);
  return out;
}

/** Test/maintenance helper. */
export function _reset() {
  registry.clear();
}
