import type { ReactNode } from "react";
import { View } from "react-native";
import { useTheme } from "../../theme";
import AppText from "./AppText";
import AppCard from "./AppCard";

type Tone = "primary" | "success" | "warning" | "danger" | "info";

interface Props {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tone?: Tone;
  style?: object;
}

export default function AppStatCard({
  label,
  value,
  icon,
  tone = "primary",
  style,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const toneColor: Record<Tone, string> = {
    primary: c.primary,
    success: c.success,
    warning: c.warning,
    danger: c.danger,
    info: c.info,
  };
  const soft: Record<Tone, string> = {
    primary: c.primarySoft,
    success: c.successSoft,
    warning: c.warningSoft,
    danger: c.dangerSoft,
    info: c.infoSoft,
  };

  return (
    <AppCard style={{ flex: 1, gap: 10, ...style }}>
      {icon ? (
        <View
          style={{
            height: 40,
            width: 40,
            borderRadius: theme.radius.md,
            backgroundColor: soft[tone],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </View>
      ) : null}
      <AppText style={{ fontSize: 24, fontWeight: "900", color: toneColor[tone] }}>
        {value}
      </AppText>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
    </AppCard>
  );
}
