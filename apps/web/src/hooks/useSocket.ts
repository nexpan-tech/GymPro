// src/hooks/useSocket.ts
// Manages the Socket.IO connection for realtime events.
//
// All useSocket() consumers share ONE underlying Socket.IO connection (a
// module-level singleton with ref-counting). This avoids:
//   • N parallel connections when several components mount the hook at once
//     (TopBar notifications + chat pages, etc.), and
//   • the "WebSocket is closed before the connection is established" console
//     churn that React StrictMode triggers by mounting → unmounting →
//     remounting effects — a fresh io() per mount would open a WS handshake and
//     immediately abort it. A deferred teardown lets the remount re-use the
//     live socket instead of recreating it.
import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth.store";

// ── Types ──────────────────────────────────────────────────────────────────────

export type SocketEvent =
  | "notification"
  | "attendance:update"
  | "payment:received"
  | "dashboard:refresh"
  | string;

export interface LastEvent<T = unknown> {
  event: SocketEvent;
  data: T;
  receivedAt: number;
}

export interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  lastEvent: LastEvent | null;
  on: <T = unknown>(event: SocketEvent, handler: (data: T) => void) => () => void;
  emit: <T = unknown>(event: SocketEvent, data?: T) => void;
}

// ── Socket URL ──────────────────────────────────────────────────────────────────
// Configurable via VITE_SOCKET_URL (preferred) → VITE_WS_URL → VITE_API_URL.
// Normalised to an ORIGIN so a value like "http://host/api/v1" doesn't make
// Socket.IO try to connect to a non-existent "/api/v1" namespace.
function resolveSocketUrl(): string {
  const env = (import.meta as unknown as { env: Record<string, string> }).env ?? {};
  const raw =
    env.VITE_SOCKET_URL || env.VITE_WS_URL || env.VITE_API_URL || "http://localhost:5050";
  try {
    return new URL(raw).origin;
  } catch {
    return raw;
  }
}

const SOCKET_URL = resolveSocketUrl();

// ── Shared singleton connection ─────────────────────────────────────────────────

const stateListeners = new Set<(connected: boolean) => void>();

let shared: Socket | null = null;
let sharedToken: string | null = null;
let refCount = 0;
let teardownTimer: ReturnType<typeof setTimeout> | null = null;
let joinRooms: { userId?: string | null; gymId?: string | null } = {};

function notifyState(connected: boolean) {
  stateListeners.forEach((fn) => fn(connected));
}

/**
 * Get (or lazily create) the shared socket for `token`, cancelling any pending
 * teardown. Throws only if io() itself throws — callers guard so realtime
 * failure never breaks render.
 */
function ensureSocket(
  token: string,
  rooms: { userId?: string | null; gymId?: string | null }
): Socket {
  if (teardownTimer) {
    clearTimeout(teardownTimer);
    teardownTimer = null;
  }
  joinRooms = rooms;

  // Token changed (login as a different user) → rebuild the connection.
  if (shared && sharedToken !== token) {
    shared.removeAllListeners();
    shared.disconnect();
    shared = null;
  }
  if (shared) return shared;

  sharedToken = token;
  const sock = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    // Bounded so a missing/broken socket backend can't spam the console with
    // endless reconnect attempts.
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10_000,
    timeout: 20_000,
    autoConnect: true,
  });

  let warnedOnce = false;

  sock.on("connect", () => {
    notifyState(true);
    // Re-join rooms after every (re)connect — server-side room membership is
    // dropped on disconnect. Join is idempotent server-side.
    if (joinRooms.userId) sock.emit("join", `user:${joinRooms.userId}`);
    if (joinRooms.gymId) sock.emit("join", `gym:${joinRooms.gymId}`);
  });

  sock.on("disconnect", () => notifyState(false));

  // Warn once, not on every retry — keeps the console clean if the realtime
  // backend is unavailable in dev.
  sock.on("connect_error", (err) => {
    const isAuthError = /unauthor/i.test(err.message);
    if (!warnedOnce) {
      console.warn(`[GymPro Socket] Realtime unavailable${isAuthError ? " (auth)" : ""}:`, err.message);
      warnedOnce = true;
    }
    // An auth rejection (missing/invalid/expired token) will never succeed by
    // retrying the SAME token, so stop the reconnect loop — otherwise each
    // bounded attempt re-fails and spams the console. A refreshed/new token
    // rebuilds the socket via ensureSocket() (token-change path above).
    if (isAuthError) sock.disconnect();
    notifyState(false);
  });

  sock.io.on("reconnect_failed", () => {
    console.warn("[GymPro Socket] Giving up on realtime after retries.");
    notifyState(false);
  });

  shared = sock;
  return sock;
}

/**
 * Drop one consumer's hold on the shared socket. The real disconnect is
 * deferred so a StrictMode remount (which re-acquires within the same tick)
 * never tears down a half-open handshake.
 */
function releaseSocket() {
  refCount = Math.max(0, refCount - 1);
  if (refCount > 0) return;
  if (teardownTimer) clearTimeout(teardownTimer);
  teardownTimer = setTimeout(() => {
    if (refCount === 0 && shared) {
      shared.removeAllListeners();
      shared.disconnect();
      shared = null;
      sharedToken = null;
    }
    teardownTimer = null;
  }, 400);
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useSocket(): UseSocketReturn {
  const { accessToken, user, isAuthenticated } = useAuthStore();

  const socketRef = useRef<Socket | null>(shared);
  const [isConnected, setIsConnected] = useState<boolean>(shared?.connected ?? false);
  const [lastEvent, setLastEvent] = useState<LastEvent | null>(null);

  // Map<event, Map<rawHandler, trackedHandler>>. We keep the exact tracked
  // wrapper that was bound so unsubscribe can `off` the SAME reference (offing
  // the raw handler would be a no-op and leak listeners). These are per hook
  // instance, so each consumer's callbacks are bound/unbound independently on
  // the shared socket.
  const listenersRef = useRef<
    Map<string, Map<(data: unknown) => void, (data: unknown) => void>>
  >(new Map());

  // ── Internal: update lastEvent state whenever any registered event fires ───
  const makeTrackingHandler = useCallback(
    (event: string, handler: (data: unknown) => void) =>
      (data: unknown) => {
        setLastEvent({ event, data, receivedAt: Date.now() });
        handler(data);
      },
    []
  );

  // ── Connect / disconnect lifecycle ─────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const token = accessToken ?? localStorage.getItem("accessToken");
    if (!token) return;

    // Acquiring the shared client must never throw into render. Realtime is an
    // enhancement — if the socket can't be created the app keeps working.
    let sock: Socket;
    try {
      sock = ensureSocket(token, { userId: user?.id, gymId: user?.gymId });
    } catch (err) {
      console.warn("[GymPro Socket] Failed to initialise:", err);
      return;
    }
    refCount += 1;
    socketRef.current = sock;
    setIsConnected(sock.connected);

    // Reflect shared connection-state changes into this instance.
    const onState = (connected: boolean) => setIsConnected(connected);
    stateListeners.add(onState);

    // Bind this instance's tracked handlers onto the shared socket. socket.io
    // preserves listeners across reconnects, so they only need binding here.
    listenersRef.current.forEach((handlerMap, event) => {
      handlerMap.forEach((tracked) => sock.on(event, tracked));
    });

    return () => {
      stateListeners.delete(onState);
      // Remove ONLY this instance's handlers from the shared socket; other
      // consumers' listeners stay intact.
      listenersRef.current.forEach((handlerMap, event) => {
        handlerMap.forEach((tracked) => sock.off(event, tracked));
      });
      socketRef.current = null;
      releaseSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken, user?.id, user?.gymId]);

  // ── on: subscribe to an event ───────────────────────────────────────────────
  const on = useCallback(
    <T = unknown>(event: SocketEvent, handler: (data: T) => void): (() => void) => {
      const rawHandler = handler as (data: unknown) => void;

      if (!listenersRef.current.has(event)) {
        listenersRef.current.set(event, new Map());
      }
      const handlerMap = listenersRef.current.get(event)!;

      // Idempotent: if this exact handler is already bound, reuse it so repeated
      // subscriptions (e.g. effect re-runs) never double-bind.
      let tracked = handlerMap.get(rawHandler);
      if (!tracked) {
        tracked = makeTrackingHandler(event, rawHandler);
        handlerMap.set(rawHandler, tracked);
        socketRef.current?.on(event, tracked);
      }

      // Unsubscribe removes the EXACT tracked wrapper that was bound.
      return () => {
        const t = handlerMap.get(rawHandler);
        if (t) {
          socketRef.current?.off(event, t);
          handlerMap.delete(rawHandler);
        }
      };
    },
    [makeTrackingHandler]
  );

  // ── emit: send an event to the server ──────────────────────────────────────
  const emit = useCallback(<T = unknown>(event: SocketEvent, data?: T) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(`[GymPro Socket] Cannot emit '${event}' — not connected.`);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    lastEvent,
    on,
    emit,
  };
}
