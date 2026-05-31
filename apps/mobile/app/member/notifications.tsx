import { router } from "expo-router";
import {
  ArrowLeft,
  Bell,
  BellOff,
  CheckCheck,
  CreditCard,
  Dumbbell,
  Info,
  Megaphone,
  Salad,
  Zap,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppCard from "../../src/components/AppCard";
import {
  getNotifications,
  markAllRead,
  markRead,
} from "../../src/api/notification.api";
import type { Notification } from "../../src/types/notification.types";

// ─── helpers ─────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

type NotifIconKey =
  | "WORKOUT"
  | "DIET"
  | "MEMBERSHIP"
  | "PAYMENT"
  | "ANNOUNCEMENT"
  | "ALERT"
  | "DEFAULT";

const ICON_MAP: Record<
  NotifIconKey,
  { icon: typeof Bell; color: string; bg: string }
> = {
  WORKOUT: { icon: Dumbbell, color: "#818cf8", bg: "#1e1b4b" },
  DIET: { icon: Salad, color: "#34d399", bg: "#064e3b" },
  MEMBERSHIP: { icon: CreditCard, color: "#f59e0b", bg: "#451a03" },
  PAYMENT: { icon: CreditCard, color: "#f87171", bg: "#450a0a" },
  ANNOUNCEMENT: { icon: Megaphone, color: "#60a5fa", bg: "#0c1a3b" },
  ALERT: { icon: Zap, color: "#fb923c", bg: "#431407" },
  DEFAULT: { icon: Info, color: "#94a3b8", bg: "#0f172a" },
};

function iconConfig(type: string) {
  const key = type?.toUpperCase() as NotifIconKey;
  return ICON_MAP[key] ?? ICON_MAP.DEFAULT;
}

// ─── screen ──────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
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
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
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
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          tintColor="#6366f1"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft color="#f8fafc" size={22} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.subtitle}>
              {unreadCount} unread
            </Text>
          )}
        </View>

        {unreadCount > 0 && (
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
              borderRadius: 12,
              backgroundColor: "#0f172a",
              borderWidth: 1,
              borderColor: "rgba(148,163,184,0.18)",
              opacity: markingAll ? 0.6 : 1,
            }}
          >
            <CheckCheck color="#6366f1" size={16} />
            <Text
              style={{ color: "#6366f1", fontWeight: "800", fontSize: 12 }}
            >
              All read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Empty state */}
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BellOff color="#334155" size={48} />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyBody}>
            You're all caught up. New alerts from your trainer and gym will
            appear here.
          </Text>
        </View>
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
                    borderColor: notif.isRead
                      ? "rgba(148,163,184,0.1)"
                      : "rgba(99,102,241,0.3)",
                    opacity: notif.isRead ? 0.72 : 1,
                  }}
                >
                  <View
                    style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}
                  >
                    {/* Type icon */}
                    <View
                      style={{
                        height: 44,
                        width: 44,
                        borderRadius: 16,
                        backgroundColor: cfg.bg,
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <IconComp color={cfg.color} size={20} />
                    </View>

                    {/* Text content */}
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: notif.isRead ? "#94a3b8" : "#f8fafc",
                            fontWeight: "900",
                            fontSize: 14,
                            flex: 1,
                            marginRight: 8,
                          }}
                          numberOfLines={1}
                        >
                          {notif.title}
                        </Text>
                        <Text
                          style={{
                            color: "#475569",
                            fontSize: 11,
                            fontWeight: "700",
                            flexShrink: 0,
                          }}
                        >
                          {relativeTime(notif.createdAt)}
                        </Text>
                      </View>

                      <Text
                        style={{
                          color: notif.isRead ? "#64748b" : "#94a3b8",
                          fontSize: 13,
                          lineHeight: 19,
                        }}
                      >
                        {notif.body}
                      </Text>

                      {/* Unread dot + tap hint */}
                      {!notif.isRead && (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 8,
                          }}
                        >
                          <View
                            style={{
                              height: 6,
                              width: 6,
                              borderRadius: 3,
                              backgroundColor: "#6366f1",
                            }}
                          />
                          <Text
                            style={{
                              color: "#6366f1",
                              fontSize: 11,
                              fontWeight: "700",
                            }}
                          >
                            Tap to mark read
                          </Text>
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
    </ScrollView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = {
  screen: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 20, paddingTop: 64, paddingBottom: 48 },
  center: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
    marginBottom: 24,
  },
  backButton: {
    height: 44,
    width: 44,
    borderRadius: 16,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  title: { color: "#f8fafc", fontSize: 26, fontWeight: "900" as const },
  subtitle: { color: "#64748b", fontSize: 13, marginTop: 2 },
  emptyContainer: {
    alignItems: "center" as const,
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900" as const,
    textAlign: "center" as const,
  },
  emptyBody: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center" as const,
  },
};
