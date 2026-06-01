import { View } from "react-native";
import { useTheme } from "../../theme";
import AppText from "./AppText";

type Tone = "primary" | "success" | "warning" | "danger" | "info" | "neutral";

interface Props {
  label: string;
  tone?: Tone;
}

export default function AppBadge({ label, tone = "neutral" }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const map: Record<Tone, { bg: string; fg: string }> = {
    primary: { bg: c.primarySoft, fg: c.primary },
    success: { bg: c.successSoft, fg: c.success },
    warning: { bg: c.warningSoft, fg: c.warning },
    danger: { bg: c.dangerSoft, fg: c.danger },
    info: { bg: c.infoSoft, fg: c.info },
    neutral: { bg: c.muted, fg: c.textSecondary },
  };
  const { bg, fg } = map[tone];

  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: bg,
        borderRadius: theme.radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
    >
      <AppText variant="caption" style={{ color: fg }}>
        {label}
      </AppText>
    </View>
  );
}
