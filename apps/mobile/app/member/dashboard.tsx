import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Award, Bell, ChevronRight, CreditCard, Dumbbell, Flame, LogIn, LogOut,
  MessageSquare, Salad, Sparkles, Target, TrendingUp, Trophy,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";

import { attendanceService } from "../../src/services/attendance.service";
import { memberService, type MemberStreak } from "../../src/services/member.service";
import { membershipService } from "../../src/services/membership.service";
import { workoutService, type TodayWorkout } from "../../src/services/workout.service";
import { dietService, type TodayDiet } from "../../src/services/diet.service";
import { gamificationService, type LeaderboardRow, type EarnedBadge } from "../../src/services/gamification.service";
import { getMyGoals, getMySummary, type ProgressGoal, type ProgressSummary } from "../../src/api/progress.api";
import { getMyNotifications, type MyNotifications } from "../../src/api/notification.api";
import { useAuthStore } from "../../src/stores/auth.store";
import { useTheme } from "../../src/theme";
import { AppCard, AppScreen, AppText, AppLoadingState } from "../../src/components/ui";
import type { Attendance } from "../../src/types/attendance.types";
import type { Member } from "../../src/types/member.types";

// ─── helpers ──────────────────────────────────────────────────────────────────

function greet(name: string) {
  const h = new Date().getHours();
  const s = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${s}, ${name.split(" ")[0]}`;
}
function todayLabel() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
function daysRemaining(endDate?: string | null) {
  if (!endDate) return null;
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000));
}

const MOTIVATION = [
  "Discipline is choosing what you want most over what you want now.",
  "You don't have to be extreme — just consistent.",
  "The body achieves what the mind believes.",
  "Small steps every day add up to big results.",
  "Showing up is half the battle. You've already won it.",
  "Your only competition is who you were yesterday.",
  "Sweat now, shine later.",
];
function dailyMotivation() {
  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((Date.now() - start) / 86_400_000);
  return MOTIVATION[dayOfYear % MOTIVATION.length];
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function MemberDashboardScreen() {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const c = theme.colors;

  const [member, setMember] = useState<Member | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [streak, setStreak] = useState<MemberStreak | null>(null);
  const [membership, setMembership] = useState<Awaited<ReturnType<typeof membershipService.getMyMembership>> | null>(null);
  const [today, setToday] = useState<TodayWorkout | null>(null);
  const [diet, setDiet] = useState<TodayDiet | null>(null);
  const [goals, setGoals] = useState<ProgressGoal[]>([]);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [leaders, setLeaders] = useState<LeaderboardRow[]>([]);
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [notifs, setNotifs] = useState<MyNotifications | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const profile = await memberService.getMyProfile();
      setMember(profile);
      const results = await Promise.allSettled([
        attendanceService.getMyAttendance(),
        memberService.getStreak(),
        membershipService.getMyMembership(),
        workoutService.getToday(),
        dietService.getMyToday(),
        getMyGoals(),
        getMySummary(),
        gamificationService.leaderboard(),
        gamificationService.myBadges(),
        getMyNotifications(),
      ]);
      const val = <T,>(i: number, d: T): T => (results[i].status === "fulfilled" ? (results[i] as PromiseFulfilledResult<T>).value : d);
      setAttendance(val<Attendance[]>(0, []));
      setStreak(val<MemberStreak | null>(1, null));
      setMembership(val(2, null));
      setToday(val<TodayWorkout | null>(3, null));
      setDiet(val<TodayDiet | null>(4, null));
      setGoals(val<ProgressGoal[]>(5, []));
      setSummary(val<ProgressSummary | null>(6, null));
      setLeaders(val<LeaderboardRow[]>(7, []));
      setBadges(val<EarnedBadge[]>(8, []));
      setNotifs(val<MyNotifications | null>(9, null));
    } catch (err) {
      console.log("Dashboard load failed", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const displayName = member?.user?.name || user?.name || "Member";
  const daysLeft = useMemo(() => daysRemaining(membership?.endDate), [membership]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecord = attendance.find((r) => r.date.slice(0, 10) === todayStr);
  const isInside = todayRecord?.status === "CHECKED_IN";

  const assignment = today?.assignments?.[0] ?? null;
  const exCount = assignment?.workoutPlan.exercises?.length ?? 0;
  const mealCount = diet?.mealCount ?? 0;
  const dietKcal = (diet?.meals ?? []).reduce((s, m) => s + (m.calories ?? 0), 0);
  const topGoal = goals.filter((g) => g.status === "ACTIVE").sort((a, b) => (b.progressPercent ?? 0) - (a.progressPercent ?? 0))[0];
  const top3 = leaders.slice(0, 3);
  const myRank = leaders.find((r) => r.memberId === member?.id);
  const unread = notifs?.unreadCount ?? 0;
  // Never call .length on a possibly-undefined field — always an array.
  const notificationItems = Array.isArray(notifs?.items) ? notifs.items : [];
  const consistency = summary?.consistencyScore ?? streak?.thisMonth.consistency ?? 0;

  if (loading) {
    return (
      <AppScreen>
        <AppLoadingState rows={5} />
      </AppScreen>
    );
  }

  return (
    <AppScreen onRefresh={() => { setRefreshing(true); void load(); }} refreshing={refreshing}>
      {/* 1. Greeting + notifications */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <AppText variant="heading">{greet(displayName)}</AppText>
          <AppText variant="caption" color="textMuted">{todayLabel()}</AppText>
        </View>
        <TouchableOpacity onPress={() => router.push("/member/notifications")} activeOpacity={0.8} style={{ padding: 8 }}>
          <Bell color={c.textPrimary} size={22} />
          {unread > 0 ? (
            <View style={{ position: "absolute", top: 4, right: 4, minWidth: 16, height: 16, paddingHorizontal: 3, borderRadius: 8, backgroundColor: c.primary, alignItems: "center", justifyContent: "center" }}>
              <AppText style={{ fontSize: 9, fontWeight: "900", color: c.onPrimary }}>{unread > 9 ? "9+" : unread}</AppText>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* 2 + 3. Streak hero with daily motivation */}
      <LinearGradient colors={["#161616", "#010000"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ borderRadius: theme.radius.xl, padding: theme.spacing.lg, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <View style={{ position: "absolute", top: -40, right: -30, height: 120, width: 120, borderRadius: 999, backgroundColor: c.primary, opacity: 0.22 }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={{ height: 64, width: 64, borderRadius: 999, backgroundColor: "rgba(231,55,37,0.18)", borderWidth: 1, borderColor: c.primary, alignItems: "center", justifyContent: "center" }}>
            <Flame color={c.primary} size={28} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="overline" style={{ color: "rgba(255,255,255,0.55)", letterSpacing: 1 }}>Current streak</AppText>
            <AppText style={{ fontSize: 34, fontWeight: "900", color: "#FFFFFF", lineHeight: 38 }}>
              {streak?.current ?? 0}<AppText style={{ fontSize: 16, color: "rgba(255,255,255,0.6)" }}> days</AppText>
            </AppText>
            <AppText variant="caption" style={{ color: "rgba(255,255,255,0.7)" }}>Best {streak?.best ?? 0} · {consistency}% this month</AppText>
          </View>
        </View>
        <View style={{ marginTop: 14, flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
          <Sparkles color={c.primary} size={15} style={{ marginTop: 2 }} />
          <AppText variant="caption" style={{ color: "#FFFFFF", flex: 1, lineHeight: 20 }}>{dailyMotivation()}</AppText>
        </View>
      </LinearGradient>

      {/* 4. Today's Workout */}
      <SectionHeader title="Today's Workout" onPress={() => router.push("/member/workout")} />
      <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/member/workout")}>
        <AppCard variant="elevated">
          {assignment ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={{ height: 46, width: 46, borderRadius: theme.radius.md, backgroundColor: c.primarySoft, alignItems: "center", justifyContent: "center" }}>
                <Dumbbell color={c.primary} size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">{assignment.workoutPlan.title}</AppText>
                <AppText variant="caption" color="textMuted">{exCount} exercises · ~{Math.max(15, exCount * 6)} min{assignment.status === "COMPLETED" ? " · ✓ done" : ""}</AppText>
              </View>
              <ChevronRight color={c.textMuted} size={20} />
            </View>
          ) : (
            <AppText variant="body" color="textMuted">No workout scheduled today — rest & recover. 🛌</AppText>
          )}
        </AppCard>
      </TouchableOpacity>

      {/* 5. Today's Diet */}
      <SectionHeader title="Today's Diet" onPress={() => router.push("/member/diet")} />
      <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/member/diet")}>
        <AppCard variant="elevated">
          {mealCount > 0 ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={{ height: 46, width: 46, borderRadius: theme.radius.md, backgroundColor: c.primarySoft, alignItems: "center", justifyContent: "center" }}>
                <Salad color={c.primary} size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">{diet?.goal || "Today's meals"}</AppText>
                <AppText variant="caption" color="textMuted">{mealCount} meal{mealCount === 1 ? "" : "s"}{dietKcal > 0 ? ` · ${dietKcal.toLocaleString()} kcal` : ""}</AppText>
              </View>
              <ChevronRight color={c.textMuted} size={20} />
            </View>
          ) : (
            <AppText variant="body" color="textMuted">No meals planned for today.</AppText>
          )}
        </AppCard>
      </TouchableOpacity>

      {/* 6. Membership */}
      <SectionHeader title="Membership" onPress={() => router.push("/member/membership")} />
      <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/member/membership")}>
        <AppCard variant="elevated">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ height: 46, width: 46, borderRadius: theme.radius.md, backgroundColor: c.primarySoft, alignItems: "center", justifyContent: "center" }}>
              <CreditCard color={c.primary} size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{membership?.planRef?.name ?? membership?.plan ?? "No active plan"}</AppText>
              <AppText variant="caption" color={daysLeft !== null && daysLeft < 10 ? "danger" : "textMuted"}>
                {daysLeft !== null ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining` : "Tap to view details"}
              </AppText>
            </View>
            <ChevronRight color={c.textMuted} size={20} />
          </View>
        </AppCard>
      </TouchableOpacity>

      {/* 7 + 8. Progress snapshot + Goal progress (side by side) */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85} onPress={() => router.push("/member/progress")}>
          <AppCard>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TrendingUp color={c.primary} size={16} />
              <AppText variant="overline" color="primary">Progress</AppText>
            </View>
            <AppText style={{ fontSize: 26, fontWeight: "900", color: c.textPrimary, marginTop: 6 }}>{consistency}%</AppText>
            <AppText variant="caption" color="textMuted">consistency</AppText>
          </AppCard>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85} onPress={() => router.push("/member/goals")}>
          <AppCard>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Target color={c.primary} size={16} />
              <AppText variant="overline" color="primary">Top goal</AppText>
            </View>
            {topGoal ? (
              <>
                <AppText variant="bodyStrong" numberOfLines={1} style={{ marginTop: 6 }}>{topGoal.title}</AppText>
                <View style={{ marginTop: 8, height: 6, borderRadius: 3, backgroundColor: c.muted, overflow: "hidden" }}>
                  <View style={{ height: "100%", width: `${Math.min(100, Math.round(topGoal.progressPercent ?? 0))}%`, backgroundColor: c.primary }} />
                </View>
              </>
            ) : (
              <AppText variant="caption" color="textMuted" style={{ marginTop: 6 }}>Set a goal →</AppText>
            )}
          </AppCard>
        </TouchableOpacity>
      </View>

      {/* 9. Leaderboard preview */}
      <SectionHeader title="Leaderboard" onPress={() => router.push("/member/leaderboard")} />
      <AppCard>
        {top3.length === 0 ? (
          <AppText variant="caption" color="textMuted">Earn XP to climb the leaderboard.</AppText>
        ) : (
          <View style={{ gap: 10 }}>
            {top3.map((r) => (
              <View key={r.memberId} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <AppText style={{ width: 22, fontWeight: "900", color: r.rank === 1 ? c.primary : c.textSecondary }}>#{r.rank}</AppText>
                <AppText variant="body" style={{ flex: 1 }} numberOfLines={1}>{r.name}</AppText>
                <AppText variant="caption" color="textMuted">{r.xp ?? 0} XP</AppText>
              </View>
            ))}
            {myRank && myRank.rank > 3 ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 8 }}>
                <AppText style={{ width: 22, fontWeight: "900", color: c.primary }}>#{myRank.rank}</AppText>
                <AppText variant="body" style={{ flex: 1 }}>You</AppText>
                <AppText variant="caption" color="textMuted">{myRank.xp ?? 0} XP</AppText>
              </View>
            ) : null}
          </View>
        )}
      </AppCard>

      {/* 10. Achievements */}
      <SectionHeader title="Achievements" onPress={() => router.push("/member/achievements")} />
      <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/member/achievements")}>
        <AppCard>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ height: 44, width: 44, borderRadius: theme.radius.md, backgroundColor: c.primarySoft, alignItems: "center", justifyContent: "center" }}>
              <Award color={c.primary} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{badges.length} badge{badges.length === 1 ? "" : "s"} earned</AppText>
              <AppText variant="caption" color="textMuted" numberOfLines={1}>
                {badges.length ? badges.slice(0, 3).map((b) => b.badge.name).join(" · ") : "Keep training to earn your first badge."}
              </AppText>
            </View>
            <ChevronRight color={c.textMuted} size={20} />
          </View>
        </AppCard>
      </TouchableOpacity>

      {/* 11. Attendance status */}
      <SectionHeader title="Attendance" />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85} onPress={() => router.push("/member/scanner?action=checkin")}>
          <AppCard style={{ borderColor: isInside ? c.success : c.border }}>
            <LogIn color={isInside ? c.success : c.primary} size={20} />
            <AppText variant="bodyStrong" style={{ marginTop: 8 }}>{isInside ? "Checked in" : "Check in"}</AppText>
            <AppText variant="caption" color="textMuted">{isInside && todayRecord ? new Date(todayRecord.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Scan gym QR"}</AppText>
          </AppCard>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85} disabled={!isInside} onPress={() => router.push("/member/scanner?action=checkout")}>
          <AppCard style={{ opacity: isInside ? 1 : 0.5 }}>
            <LogOut color={c.textSecondary} size={20} />
            <AppText variant="bodyStrong" style={{ marginTop: 8 }}>Check out</AppText>
            <AppText variant="caption" color="textMuted">{isInside ? "Tap to scan" : "After check-in"}</AppText>
          </AppCard>
        </TouchableOpacity>
      </View>

      {/* 12. Notifications preview */}
      {notificationItems.length > 0 ? (
        <>
          <SectionHeader title="Latest" onPress={() => router.push("/member/notifications")} />
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/member/notifications")}>
            <AppCard>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Bell color={c.primary} size={18} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong" numberOfLines={1}>{notificationItems[0].title}</AppText>
                  <AppText variant="caption" color="textMuted" numberOfLines={1}>{notificationItems[0].body}</AppText>
                </View>
              </View>
            </AppCard>
          </TouchableOpacity>
        </>
      ) : null}

      {/* 13. Quick actions */}
      <SectionHeader title="Quick Actions" />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {[
          { icon: <Target color={c.primary} size={20} />, label: "Goals", to: "/member/goals" },
          { icon: <TrendingUp color={c.primary} size={20} />, label: "Progress", to: "/member/progress" },
          { icon: <Trophy color={c.primary} size={20} />, label: "Leaderboard", to: "/member/leaderboard" },
          { icon: <MessageSquare color={c.primary} size={20} />, label: "Chat", to: "/member/chat" },
          { icon: <CreditCard color={c.primary} size={20} />, label: "Membership", to: "/member/membership" },
          { icon: <Award color={c.primary} size={20} />, label: "Rewards", to: "/member/rewards" },
        ].map((a) => (
          <TouchableOpacity key={a.label} activeOpacity={0.85} onPress={() => router.push(a.to as never)} style={{ width: "30%", flexGrow: 1 }}>
            <AppCard style={{ alignItems: "center", paddingVertical: 16 }}>
              {a.icon}
              <AppText variant="caption" style={{ marginTop: 6 }}>{a.label}</AppText>
            </AppCard>
          </TouchableOpacity>
        ))}
      </View>
    </AppScreen>
  );
}

function SectionHeader({ title, onPress }: { title: string; onPress?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
      <AppText variant="heading">{title}</AppText>
      {onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          <AppText variant="label" color="primary">See all</AppText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
