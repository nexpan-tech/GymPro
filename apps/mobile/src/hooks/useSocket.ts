import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_URL, TOKEN_KEYS } from '../utils/constants';
import { getItem } from '../utils/storage';
import { useAuthStore } from '../stores/auth.store';
import { useNotificationStore } from '../stores/notification.store';
import type { Notification } from '../types/notification.types';

export interface SocketHook {
  isConnected: boolean;
  socket: Socket | null;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  emit: (event: string, ...args: unknown[]) => void;
}

/**
 * Authenticated Socket.IO connection to the GymPro backend.
 *
 * The server (apps/backend/src/realtime/socket.ts) reads the JWT from
 * `handshake.auth.token` and AUTO-JOINS `user:<id>` and `gym:<id>` rooms, so
 * the client never emits its own join. Reconnects automatically, and forces a
 * reconnect when the app returns to the foreground.
 */
export function useSocket(): SocketHook {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;

    async function connect() {
      // Realtime is non-critical: never let a socket failure crash a screen.
      try {
        const accessToken = await getItem(TOKEN_KEYS.ACCESS);
        if (!active || !accessToken) return;

        const socket = io(SOCKET_URL, {
          auth: { token: accessToken },
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          if (active) setIsConnected(true);
        });
        socket.on('disconnect', () => {
          if (active) setIsConnected(false);
        });
        socket.on('connect_error', () => {
          if (active) setIsConnected(false);
        });

        // Real-time events emitted by the backend (SOCKET_EVENTS).
        socket.on('notification', (payload: Notification) => {
          addNotification(payload);
        });
        socket.on('dashboard:update', () => {});
        socket.on('attendance:update', () => {});
        socket.on('leaderboard:update', () => {});
      } catch {
        // Swallow — UI continues to work without realtime.
      }
    }

    void connect();

    // Reconnect on app foreground (mobile sockets drop while backgrounded).
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active' && socketRef.current && !socketRef.current.connected) {
        socketRef.current.connect();
      }
    });

    return () => {
      active = false;
      sub.remove();
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, user?.id, user?.gymId, addNotification]);

  const on = useCallback(
    (event: string, handler: (...args: unknown[]) => void) => {
      socketRef.current?.on(event, handler);
    },
    [],
  );

  const emit = useCallback((event: string, ...args: unknown[]) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  return { isConnected, socket: socketRef.current, on, emit };
}
