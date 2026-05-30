// src/hooks/useNotifications.ts
// Combines TanStack Query (initial REST load) with Socket.IO realtime events.
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";
import {
  useNotificationStore,
  type AppNotification,
} from "@/store/notification.store";
import { useSocket } from "./useSocket";
import { useAuthStore } from "@/store/auth.store";

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { setNotifications, addNotification, markRead, markAllRead } =
    useNotificationStore();

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  // ── Socket ─────────────────────────────────────────────────────────────────
  const { on } = useSocket();

  // ── Initial load via React Query ───────────────────────────────────────────
  const { isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const res = await notificationService.list({
        memberId: user?.id,
        gymId: user?.gymId ?? undefined,
      });
      const raw = res.data;
      // Normalize to AppNotification shape
      const list: AppNotification[] = (raw.notifications ?? []).map((n) => ({
        ...n,
        // The service uses `message` and `isRead`; notification.types uses `body` and `status`.
        // Map common fields defensively.
        id: n.id,
        title: n.title,
        message: (n as unknown as Record<string, string>).body ?? n.message,
        isRead:
          n.isRead ??
          ((n as unknown as Record<string, string>).status === "READ"),
        createdAt: n.createdAt,
      }));
      setNotifications(list);
      return list;
    },
    enabled: Boolean(user?.id),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // ── Realtime: listen for 'notification' socket events ──────────────────────
  useEffect(() => {
    const unsubscribe = on<AppNotification>("notification", (data) => {
      addNotification(data);
      // Invalidate the query cache so a background refetch can reconcile
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    });
    return unsubscribe;
  }, [on, addNotification, queryClient, user?.id]);

  // ── markRead mutation ──────────────────────────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onMutate: (id) => {
      // Optimistic update
      markRead(id);
    },
    onError: (_err, id) => {
      // Revert: re-mark as unread by toggling the store back
      // The store doesn't expose un-markRead, so just invalidate to re-sync
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
      console.warn("[useNotifications] markRead failed for", id);
    },
  });

  // ── markAllRead mutation ───────────────────────────────────────────────────
  const markAllReadMutation = useMutation({
    mutationFn: () =>
      notificationService.markAllRead({
        memberId: user?.id,
        gymId: user?.gymId ?? undefined,
      }),
    onMutate: () => {
      markAllRead();
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead: (id: string) => markReadMutation.mutate(id),
    markAllRead: () => markAllReadMutation.mutate(),
  };
}
