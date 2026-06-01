import type { ReactNode } from "react";
import { TouchableOpacity, View } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useTheme } from "../../theme";
import AppText from "./AppText";

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}

export default function AppHeader({ title, subtitle, onBack, right }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginBottom: theme.spacing.lg,
      }}
    >
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{
            height: 44,
            width: 44,
            borderRadius: theme.radius.md,
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft color={c.textPrimary} size={22} />
        </TouchableOpacity>
      ) : null}

      <View style={{ flex: 1 }}>
        <AppText variant="title">{title}</AppText>
        {subtitle ? (
          <AppText variant="body" color="textSecondary" style={{ marginTop: 2 }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {right ? <View>{right}</View> : null}
    </View>
  );
}
