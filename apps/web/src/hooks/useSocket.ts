// src/hooks/useSocket.ts
// Manages the Socket.IO connection for realtime events.
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

// ── Constants ─────────────────────────────────────────────────────────────────

const SOCKET_URL =
  (import.meta as unknown as { env: Record<string, string> }).env
    ?.VITE_WS_URL ||
  (import.meta as unknown as { env: Record<string, string> }).env
    ?.VITE_API_URL ||
  "http://localhost:5050";

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useSocket(): UseSocketReturn {
  const { accessToken, user, isAuthenticated } = useAuthStore();

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<LastEvent | null>(null);

  // Map<event, Map<rawHandler, trackedHandler>>. We keep the exact tracked
  // wrapper that was bound so unsubscribe can `off` the SAME reference (offing
  // the raw handler would be a no-op and leak listeners). socket.io preserves
  // listeners across reconnects on the same Socket instance, so we never re-bind
  // on reconnect — that was duplicating handlers.
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

    // Creating the client must never throw into render. Realtime is an
    // enhancement — if the socket can't be created the app keeps working.
    let sock: Socket;
    try {
      sock = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        // Bounded so a missing/broken socket backend can't spam the console
        // with endless reconnect attempts.
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10_000,
        timeout: 20_000,
        autoConnect: true,
      });
    } catch (err) {
      console.warn("[GymPro Socket] Failed to initialise:", err);
      return;
    }

    socketRef.current = sock;
    let warnedOnce = false;

    // Bind any handlers registered before this socket instance existed (or that
    // survived a socket *recreation*, e.g. token change). The previous instance
    // was removeAllListeners()+disconnect()ed in cleanup, so this binds each
    // tracked wrapper exactly once onto the new instance.
    listenersRef.current.forEach((handlerMap, event) => {
      handlerMap.forEach((tracked) => sock.on(event, tracked));
    });

    // ── Connection lifecycle events ─────────────────────────────────────────
    sock.on("connect", () => {
      setIsConnected(true);

      // Re-join rooms after every (re)connect — server-side room membership is
      // dropped on disconnect. Event listeners themselves persist on the Socket
      // instance, so we do NOT re-bind them here (that caused duplicates).
      if (user?.id) sock.emit("join", `user:${user.id}`);
      if (user?.gymId) sock.emit("join", `gym:${user.gymId}`);
    });

    sock.on("disconnect", () => {
      setIsConnected(false);
    });

    // Warn once, not on every retry — keeps the console clean if the realtime
    // backend is unavailable in dev.
    sock.on("connect_error", (err) => {
      if (!warnedOnce) {
        console.warn("[GymPro Socket] Realtime unavailable:", err.message);
        warnedOnce = true;
      }
      setIsConnected(false);
    });

    sock.io.on("reconnect_failed", () => {
      console.warn("[GymPro Socket] Giving up on realtime after retries.");
      setIsConnected(false);
    });

    return () => {
      sock.removeAllListeners();
      sock.disconnect();
      socketRef.current = null;
      setIsConnected(false);
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
