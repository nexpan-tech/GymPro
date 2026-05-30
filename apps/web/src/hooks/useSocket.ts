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

  // Track registered listeners so we can re-bind after reconnects.
  // Map<event, Set<handler>>
  const listenersRef = useRef<Map<string, Set<(data: unknown) => void>>>(new Map());

  // ── Internal: bind a single event → handler pair onto the live socket ──────
  const bindListener = useCallback(
    (sock: Socket, event: string, handler: (data: unknown) => void) => {
      sock.on(event, handler);
    },
    []
  );

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

    const sock = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
      timeout: 20_000,
      autoConnect: true,
    });

    socketRef.current = sock;

    // ── Connection lifecycle events ─────────────────────────────────────────
    sock.on("connect", () => {
      setIsConnected(true);

      // Join user and gym rooms
      if (user?.id) sock.emit("join", `user:${user.id}`);
      if (user?.gymId) sock.emit("join", `gym:${user.gymId}`);

      // Re-bind all previously registered listeners after reconnection
      listenersRef.current.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          const tracked = makeTrackingHandler(event, handler);
          bindListener(sock, event, tracked);
        });
      });
    });

    sock.on("disconnect", () => {
      setIsConnected(false);
    });

    sock.on("connect_error", (err) => {
      console.warn("[GymPro Socket] Connection error:", err.message);
      setIsConnected(false);
    });

    return () => {
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

      // Register in our ref map for re-binding after reconnects
      if (!listenersRef.current.has(event)) {
        listenersRef.current.set(event, new Set());
      }
      listenersRef.current.get(event)!.add(rawHandler);

      // If socket is already live, bind immediately
      if (socketRef.current) {
        const tracked = makeTrackingHandler(event, rawHandler);
        bindListener(socketRef.current, event, tracked);
      }

      // Return unsubscribe function
      return () => {
        listenersRef.current.get(event)?.delete(rawHandler);
        if (socketRef.current) {
          socketRef.current.off(event, rawHandler);
        }
      };
    },
    [makeTrackingHandler, bindListener]
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
