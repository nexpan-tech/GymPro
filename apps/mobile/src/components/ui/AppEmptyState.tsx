import { View } from "react-native";
import { useTheme } from "../../theme";
import AppText from "./AppText";
import AppButton from "./AppButton";

interface Props {
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function AppEmptyState({
  emoji = "✨",
  title,
  description,
  actionLabel,
  onAction,
}: Props) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        alignItems: "center",
        gap: theme.spacing.md,
        paddingVertical: theme.spacing["3xl"],
        paddingHorizontal: theme.spacing.xl,
      }}
    >
      <AppText style={{ fontSize: 44 }}>{emoji}</AppText>
      <AppText variant="heading" style={{ textAlign: "center" }}>
        {title}
      </AppText>
      {description ? (
        <AppText
          variant="body"
          color="textSecondary"
          style={{ textAlign: "center" }}
        >
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <AppButton size="md" onPress={onAction} style={{ marginTop: 4 }}>
          {actionLabel}
        </AppButton>
      ) : null}
    </View>
  );
}
