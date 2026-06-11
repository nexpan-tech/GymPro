import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight, Flame } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";

import { useTheme } from "../../theme";
import AppText from "./AppText";
import ProgressRing from "./ProgressRing";

interface MissionCardProps {
  /** Current streak (days). Drives the ring + flame chip. */
  streak: number;
  /** Weekly goal used for the ring fill (default 7). */
  goal?: number;
  /** Motivational mission headline. */
  title: string;
  /** Supporting line under the headline. */
  subtitle?: string;
  /** Optional primary call-to-action. */
  ctaLabel?: string;
  onPressCta?: () => void;
}

/**
 * MissionCard — the member dashboard's "Today's Mission" command hero.
 * A jet-black gradient surface with a red energy glow, an activity-ring streak,
 * a bold mission headline, and a primary action. Mirrors the web CommandHero so
 * the brand reads the same on every device. Palette-strict (red / black / white).
 */
export default function MissionCard({
  streak,
  goal = 7,
  title,
  subtitle,
  ctaLabel,
  onPressCta,
}: MissionCardProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const ringValue = Math.min(1, streak / goal);

  return (
    <LinearGradient
      colors={["#161616", "#010000"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: theme.radius.xl,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}
    >
      {/* Red energy glow — top-right corner. */}
      <View
        style={{
          position: "absolute",
          top: -54,
          right: -36,
          height: 150,
          width: 150,
          borderRadius: 999,
          backgroundColor: c.primary,
          opacity: 0.22,
        }}
      />

      <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
        <ProgressRing
          progress={ringValue}
          size={104}
          dotSize={8}
          trackColor="rgba(255,255,255,0.16)"
        >
          <AppText style={{ fontSize: 28, fontWeight: "900", letterSpacing: -1, color: "#FFFFFF" }}>
            {streak}
          </AppText>
          <AppText
            variant="overline"
            style={{ marginTop: 2, color: "rgba(255,255,255,0.55)" }}
          >
            Day{streak === 1 ? "" : "s"}
          </AppText>
        </ProgressRing>

        <View style={{ flex: 1, gap: 8 }}>
          <View
            style={{
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: theme.radius.pill,
              backgroundColor: "rgba(231,55,37,0.18)",
              borderWidth: 1,
              borderColor: "rgba(231,55,37,0.35)",
            }}
          >
            <Flame color={c.primary} size={13} />
            <AppText
              variant="overline"
              style={{ color: "#FFFFFF", letterSpacing: 1 }}
            >
              Today's Mission
            </AppText>
          </View>

          <AppText
            variant="heading"
            style={{ color: "#FFFFFF", lineHeight: 25 }}
          >
            {title}
          </AppText>

          {subtitle ? (
            <AppText
              variant="caption"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>

      {ctaLabel ? (
        <TouchableOpacity
          onPress={onPressCta}
          activeOpacity={0.85}
          style={{
            marginTop: 16,
            height: 46,
            borderRadius: theme.radius.md,
            backgroundColor: c.primary,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <AppText variant="label" style={{ color: "#FFFFFF", fontSize: 14 }}>
            {ctaLabel}
          </AppText>
          <ChevronRight color="#FFFFFF" size={18} />
        </TouchableOpacity>
      ) : null}
    </LinearGradient>
  );
}
