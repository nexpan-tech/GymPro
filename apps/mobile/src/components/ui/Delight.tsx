import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight, Flame, TrendingDown, TrendingUp, Trophy } from "lucide-react-native";
import { type ReactNode, useEffect, useRef } from "react";
import { Animated, TouchableOpacity, View } from "react-native";

import { useTheme } from "../../theme";
import AppText from "./AppText";

// ─── CelebrationCard ────────────────────────────────────────────────────────
// Jet-black gradient hero for big member moments (workout done, reward, etc).
export function CelebrationCard({
  emoji,
  icon,
  title,
  message,
  ctaLabel,
  onPressCta,
}: {
  emoji?: string;
  icon?: ReactNode;
  title: string;
  message?: string;
  ctaLabel?: string;
  onPressCta?: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <LinearGradient
      colors={["#161616", "#010000"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: theme.radius.xl,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: "rgba(231,55,37,0.35)",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          position: "absolute",
          top: -50,
          right: -34,
          height: 150,
          width: 150,
          borderRadius: 999,
          backgroundColor: c.primary,
          opacity: 0.28,
        }}
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View
          style={{
            height: 54,
            width: 54,
            borderRadius: theme.radius.md,
            backgroundColor: c.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon ?? <AppText style={{ fontSize: 26 }}>{emoji ?? "🏆"}</AppText>}
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <AppText variant="heading" style={{ color: "#FFFFFF" }}>
            {title}
          </AppText>
          {message ? (
            <AppText variant="caption" style={{ color: "rgba(255,255,255,0.7)" }}>
              {message}
            </AppText>
          ) : null}
        </View>
      </View>
      {ctaLabel ? (
        <TouchableOpacity
          onPress={onPressCta}
          activeOpacity={0.85}
          style={{
            marginTop: 14,
            height: 44,
            borderRadius: theme.radius.md,
            backgroundColor: c.primary,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <AppText variant="label" style={{ color: "#FFFFFF" }}>
            {ctaLabel}
          </AppText>
          <ChevronRight color="#FFFFFF" size={18} />
        </TouchableOpacity>
      ) : null}
    </LinearGradient>
  );
}

// ─── StreakBadge ────────────────────────────────────────────────────────────
export function StreakBadge({ days, label }: { days: number; label?: string }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: theme.radius.pill,
        backgroundColor: c.primarySoft,
        borderWidth: 1,
        borderColor: "rgba(231,55,37,0.3)",
      }}
    >
      <Flame color={c.primary} size={13} />
      <AppText variant="caption" color="primary">
        {label ?? (days > 0 ? `${days}-day streak` : "Start your streak")}
      </AppText>
    </View>
  );
}

// ─── MomentumBadge ──────────────────────────────────────────────────────────
export function MomentumBadge({ value, label }: { value: number; label?: string }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: theme.radius.pill,
        backgroundColor: up ? c.primarySoft : c.muted,
      }}
    >
      <Icon color={up ? c.primary : c.textMuted} size={12} />
      <AppText variant="caption" style={{ color: up ? c.primary : c.textMuted, fontWeight: "800" }}>
        {value > 0 ? "+" : ""}
        {value}
        {label ? ` ${label}` : "%"}
      </AppText>
    </View>
  );
}

// ─── MilestoneCard ──────────────────────────────────────────────────────────
export function MilestoneCard({
  emoji,
  value,
  label,
  achieved = true,
}: {
  emoji?: string;
  value: string | number;
  label: string;
  achieved?: boolean;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View
      style={{
        flex: 1,
        minWidth: 96,
        alignItems: "center",
        gap: 6,
        padding: 14,
        borderRadius: theme.radius.lg,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: achieved ? "rgba(231,55,37,0.3)" : c.border,
      }}
    >
      <View
        style={{
          height: 40,
          width: 40,
          borderRadius: theme.radius.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: achieved ? c.primary : c.muted,
        }}
      >
        <AppText style={{ fontSize: 18 }}>{emoji ?? "🏅"}</AppText>
      </View>
      <AppText style={{ fontSize: 20, fontWeight: "900", color: c.textPrimary }}>{value}</AppText>
      <AppText variant="caption" color="textMuted" style={{ textAlign: "center" }}>
        {label}
      </AppText>
    </View>
  );
}

// ─── ProgressBar (animated reveal) ──────────────────────────────────────────
export function ProgressBar({
  progress,
  height = 8,
  tint,
  track,
}: {
  /** 0..1 */
  progress: number;
  height?: number;
  tint?: string;
  track?: string;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const anim = useRef(new Animated.Value(0)).current;
  const p = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: p,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [p, anim]);

  return (
    <View
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: track ?? c.muted,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={{
          height: "100%",
          borderRadius: height / 2,
          backgroundColor: tint ?? c.primary,
          width: anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
        }}
      />
    </View>
  );
}

// ─── RingScore — labeled score with emphasis (nutrition/consistency) ─────────
export function ScorePill({
  value,
  label,
  emphasis = false,
}: {
  value: string;
  label: string;
  emphasis?: boolean;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View
      style={{
        flex: 1,
        gap: 4,
        padding: 14,
        borderRadius: theme.radius.lg,
        backgroundColor: emphasis ? c.primarySoft : c.surface,
        borderWidth: 1,
        borderColor: emphasis ? "rgba(231,55,37,0.3)" : c.border,
      }}
    >
      <AppText style={{ fontSize: 22, fontWeight: "900", color: emphasis ? c.primary : c.textPrimary }}>
        {value}
      </AppText>
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
    </View>
  );
}

// Re-export a convenient icon for celebratory headers.
export { Trophy as TrophyIcon };
