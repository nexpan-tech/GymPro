import { router } from "expo-router";
import { Megaphone } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";

import {
  getMyAnnouncements,
  markAnnouncementRead,
  type MemberAnnouncement,
} from "../../src/api/comms.api";
import {
  AppBadge,
  AppCard,
  AppEmptyState,
  AppHeader,
  AppLoadingState,
  AppScreen,
  AppText,
} from "../../src/components/ui";

const tone = (p: string) => (p === "URGENT" ? "danger" : p === "HIGH" ? "warning" : "info");

export default function AnnouncementsScreen() {
  const [items, setItems] = useState<MemberAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await getMyAnnouncements();
      setItems(res.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function open(a: MemberAnnouncement) {
    if (!a.isRead) {
      setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, isRead: true } : x)));
      await markAnnouncementRead(a.id).catch(() => undefined);
    }
  }

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Announcements" onBack={() => router.back()} />
        <AppLoadingState rows={3} />
      </AppScreen>
    );
  }

  return (
    <AppScreen onRefresh={load} refreshing={false}>
      <AppHeader title="Announcements" subtitle="Updates from your gym" onBack={() => router.back()} />
      {items.length === 0 ? (
        <AppEmptyState emoji="📣" title="No announcements" description="You're all caught up." />
      ) : (
        <View style={{ gap: 12 }}>
          {items.map((a) => (
            <TouchableOpacity key={a.id} activeOpacity={0.85} onPress={() => open(a)}>
              <AppCard variant={a.isRead ? undefined : "elevated"}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                    <Megaphone color="#6366f1" size={18} />
                    <AppText variant="bodyStrong" style={{ flex: 1 }}>{a.title}</AppText>
                    {!a.isRead && <AppBadge label="New" tone="danger" />}
                  </View>
                  <AppBadge label={a.priority} tone={tone(a.priority)} />
                </View>
                <AppText variant="caption" color="textSecondary" style={{ marginTop: 6 }}>{a.message}</AppText>
                {a.sentAt ? (
                  <AppText variant="caption" color="textMuted" style={{ marginTop: 6 }}>
                    {new Date(a.sentAt).toLocaleString()}
                  </AppText>
                ) : null}
              </AppCard>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </AppScreen>
  );
}
