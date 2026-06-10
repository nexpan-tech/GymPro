import { router } from "expo-router";
import { Flame, CalendarCheck, Sparkles, Crown } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import { attendanceService } from "../../src/services/attendance.service";
import { membershipService, type Membership } from "../../src/services/membership.service";
import { useTheme } from "../../src/theme";
import {
  AppButton,
  AppCard,
  AppHeader,
  AppLoadingState,
  AppScreen,
  AppText,
} from "../../src/components/ui";
import type { Attendance } from "../../src/types/attendance.types";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function currentStreak(records: Attendance[]) {
  if (!records.length) return 0;
  const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  let cursor = startOfDay();
  for (const r of sorted) {
    const d = startOfDay(new Date(r.date));
    const diff = Math.round((cursor.getTime() - d.getTime()) / 86_400_000);
    if (diff === 0 || diff === 1) {
      streak++;
      cursor = d;
    } else break;
  }
  return streak;
}

/** Member-facing retention nudges — positive framing only, never scare tactics. */
export default function InsightsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [records, my] = await Promise.all([
        attendanceService.getMyAttendance().catch(() => []),
        membershipService.getMy().catch(() => ({ current: null, history: [] })),
      ]);
      setAttendance(Array.isArray(records) ? records : []);
      setMembership(my.current);
    } catch (err) {
      console.log("Insights load failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="My Insights" onBack={() => router.back()} />
        <AppLoadingState rows={3} />
      </AppScreen>
    );
  }

  const weekStart = startOfDay();
  weekStart.setDate(weekStart.getDate() - 7);
  const checkInsThisWeek = attendance.filter((a) => startOfDay(new Date(a.date)) >= weekStart).length;
  const streak = currentStreak(attendance);
  const daysLeft = membership?.daysRemaining ?? null;

  // Build encouraging nudges from the member's own activity.
  const nudges: { emoji: string; title: string; body: string }[] = [];

  if (streak >= 3) {
    nudges.push({ emoji: "🔥", title: `${streak}-day streak!`, body: "You're building a strong habit. Keep the momentum going." });
  } else if (checkInsThisWeek >= 3) {
    nudges.push({ emoji: "💪", title: "Great week so far", body: `${checkInsThisWeek} check-ins this week. Consistency is paying off.` });
  } else {
    nudges.push({
      emoji: "🌟",
      title: "Every session counts",
      body: "A quick visit this week keeps your progress consistent. You've got this!",
    });
  }

  if (daysLeft !== null && daysLeft <= 7) {
    nudges.push({
      emoji: "📅",
      title: `Membership renews in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
      body: "Renew to keep your streak and progress going without a break.",
    });
  }

  nudges.push({
    emoji: "📈",
    title: "Stay active for steady progress",
    body: "Regular workouts improve your progress consistency over time. Small steps add up.",
  });

  return (
    <AppScreen onRefresh={load} refreshing={false}>
      <AppHeader title="My Insights" subtitle="Your fitness momentum" onBack={() => router.back()} />

      {/* Momentum stats */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <AppCard style={{ flex: 1, alignItems: "center", gap: 4 }}>
          <Flame color="#f97316" size={22} />
          <AppText style={{ fontSize: 22, fontWeight: "900" }}>{streak}d</AppText>
          <AppText variant="caption" color="textMuted">Streak</AppText>
        </AppCard>
        <AppCard style={{ flex: 1, alignItems: "center", gap: 4 }}>
          <CalendarCheck color={c.success} size={22} />
          <AppText style={{ fontSize: 22, fontWeight: "900" }}>{checkInsThisWeek}</AppText>
          <AppText variant="caption" color="textMuted">This week</AppText>
        </AppCard>
        <AppCard style={{ flex: 1, alignItems: "center", gap: 4 }}>
          <Crown color={c.primary} size={22} />
          <AppText style={{ fontSize: 22, fontWeight: "900" }}>{daysLeft ?? "—"}</AppText>
          <AppText variant="caption" color="textMuted">Days left</AppText>
        </AppCard>
      </View>

      {/* Nudges */}
      <View style={{ gap: 12, marginTop: 8 }}>
        {nudges.map((n, i) => (
          <AppCard key={i} variant={i === 0 ? "elevated" : undefined}>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
              <AppText style={{ fontSize: 26 }}>{n.emoji}</AppText>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">{n.title}</AppText>
                <AppText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
                  {n.body}
                </AppText>
              </View>
            </View>
          </AppCard>
        ))}
      </View>

      {daysLeft !== null && daysLeft <= 7 && (
        <AppButton style={{ marginTop: 8 }} onPress={() => router.push("/member/renew-membership")}>
          Renew Membership
        </AppButton>
      )}

      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16, justifyContent: "center" }}>
        <Sparkles color={c.textMuted} size={14} />
        <AppText variant="caption" color="textMuted">Insights update as you check in and train.</AppText>
      </View>
    </AppScreen>
  );
}
