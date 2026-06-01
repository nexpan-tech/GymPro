import { TouchableOpacity, View } from "react-native";
import { Moon, Smartphone, Sun } from "lucide-react-native";
import { useTheme } from "../../theme";
import type { ThemePreference } from "../../theme";
import AppText from "./AppText";

const OPTIONS: { key: ThemePreference; label: string }[] = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
  { key: "system", label: "Auto" },
];

/** Segmented Light / Dark / Auto theme selector. */
export default function ThemeToggle() {
  const { theme, preference, setPreference } = useTheme();
  const c = theme.colors;

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: c.muted,
        borderRadius: theme.radius.md,
        padding: 4,
        gap: 4,
      }}
    >
      {OPTIONS.map((opt) => {
        const active = preference === opt.key;
        const Icon =
          opt.key === "light" ? Sun : opt.key === "dark" ? Moon : Smartphone;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => setPreference(opt.key)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`${opt.label} theme`}
            accessibilityState={{ selected: active }}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 8,
              borderRadius: theme.radius.sm,
              backgroundColor: active ? c.surface : "transparent",
              borderWidth: active ? 1 : 0,
              borderColor: c.border,
            }}
          >
            <Icon size={15} color={active ? c.primary : c.textMuted} />
            <AppText
              variant="caption"
              style={{ color: active ? c.textPrimary : c.textMuted }}
            >
              {opt.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
