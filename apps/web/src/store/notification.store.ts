// src/store/notification.store.ts
// Zustand store for in-app notifications.
// Populated both from the REST API (initial load) and from Socket.IO events (realtime).
import { create } from "zustand";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
  /** Arbitrary extra fields from the server */
  [key: string]: unknown;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;

  // Actions
  addNotification: (n: AppNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  setNotifications: (list: AppNotification[]) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function countUnread(list: AppNotification[]): number {
  return list.filter((n) => !n.isRead).length;
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  unreadCount: 0,

  // Prepend a new notification (from socket event or API push).
  // Deduplicates by id.
  addNotification: (n) =>
    set((state) => {
      const exists = state.notifications.some((existing) => existing.id === n.id);
      if (exists) return state;
      const updated = [n, ...state.notifications];
      return { notifications: updated, unreadCount: countUnread(updated) };
    }),

  // Mark a single notification as read (optimistic update).
  markRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      return { notifications: updated, unreadCount: countUnread(updated) };
    }),

  // Mark every notification as read.
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  // Replace the full list (called after the initial API fetch).
  setNotifications: (list) =>
    set({ notifications: list, unreadCount: countUnread(list) }),
}));
