import { router } from "expo-router";
import {
  Bell,
  CheckCheck,
  CreditCard,
  Dumbbell,
  Info,
  Megaphone,
  Salad,
  Zap,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";

import {
  getNotifications,
  markAllRead,
  markRead,
} from "../../src/api/notification.api";
import type { Notification } from "../../src/types/notification.types";
import { useTheme } from "../../src/theme";
import {
  AppCard,
  AppEmptyState,
  AppHeader,
  AppLoadingState,
  AppScreen,
  AppText,
} from "../../src/components/ui";

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type NotifIconKey =
  | "WORKOUT"
  | "DIET"
  | "MEMBERSHIP"
  | "PAYMENT"
  | "ANNOUNCEMENT"
  | "ALERT"
  | "DEFAULT";

// Accent colors only — backgrounds derived as soft tint so both themes work.
const ICON_MAP: Record<NotifIconKey, { icon: typeof Bell; color: string }> = {
  WORKOUT: { icon: Dumbbell, color: "#818cf8" },
  DIET: { icon: Salad, color: "#34d399" },
  MEMBERSHIP: { icon: CreditCard, color: "#f59e0b" },
  PAYMENT: { icon: CreditCard, color: "#f87171" },
  ANNOUNCEMENT: { icon: Megaphone, color: "#60a5fa" },
  ALERT: { icon: Zap, color: "#fb923c" },
  DEFAULT: { icon: Info, color: "#94a3b8" },
};

function iconConfig(type: string) {
  const key = type?.toUpperCase() as NotifIconKey;
  return ICON_MAP[key] ?? ICON_MAP.DEFAULT;
}

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const res = await getNotifications({ limit: 50 });
      setNotifications(res.data ?? []);
    } catch (err) {
      console.log("Notifications load failed", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleMarkOne(id: string) {
    try {
      await markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.log("Mark read failed", err);
    }
  }

  async function handleMarkAll() {
    try {
      setMarkingAll(true);
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.log("Mark all read failed", err);
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Notifications" onBack={() => router.back()} />
        <AppLoadingState rows={4} />
      </AppScreen>
    );
  }

  return (
    <AppScreen onRefresh={() => load(true)} refreshing={refreshing}>
      <AppHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : undefined}
        onBack={() => router.back()}
        right={
          unreadCount > 0 ? (
            <TouchableOpacity
              onPress={handleMarkAll}
              disabled={markingAll}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: theme.radius.sm,
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.border,
                opacity: markingAll ? 0.6 : 1,
              }}
            >
              <CheckCheck color={c.primary} size={16} />
              <AppText variant="caption" color="primary">
                All read
              </AppText>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <AppEmptyState
          emoji="🔕"
          title="No notifications yet"
          description="You're all caught up. New alerts from your trainer and gym will appear here."
        />
      ) : (
        <View style={{ gap: 10 }}>
          {notifications.map((notif) => {
            const cfg = iconConfig(notif.type);
            const IconComp = cfg.icon;
            return (
              <TouchableOpacity
                key={notif.id}
                activeOpacity={notif.isRead ? 1 : 0.85}
                onPress={() => {
                  if (!notif.isRead) void handleMarkOne(notif.id);
                }}
              >
                <AppCard
                  style={{
                    borderColor: notif.isRead ? c.border : c.primary,
                    opacity: notif.isRead ? 0.72 : 1,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
                    <View
                      style={{
                        height: 44,
                        width: 44,
                        borderRadius: theme.radius.md,
                        backgroundColor: cfg.color + "22",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <IconComp color={cfg.color} size={20} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <AppText
                          variant="bodyStrong"
                          color={notif.isRead ? "textSecondary" : "textPrimary"}
                          numberOfLines={1}
                          style={{ flex: 1, marginRight: 8 }}
                        >
                          {notif.title}
                        </AppText>
                        <AppText variant="caption" color="textMuted">
                          {relativeTime(notif.createdAt)}
                        </AppText>
                      </View>

                      <AppText
                        variant="body"
                        color={notif.isRead ? "textMuted" : "textSecondary"}
                        style={{ lineHeight: 19 }}
                      >
                        {notif.body}
                      </AppText>

                      {!notif.isRead && (
                        <View
                          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}
                        >
                          <View
                            style={{ height: 6, width: 6, borderRadius: 3, backgroundColor: c.primary }}
                          />
                          <AppText variant="caption" color="primary">
                            Tap to mark read
                          </AppText>
                        </View>
                      )}
                    </View>
                  </View>
                </AppCard>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </AppScreen>
  );
}
