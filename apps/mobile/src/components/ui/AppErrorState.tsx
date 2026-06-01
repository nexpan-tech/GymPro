import { View } from "react-native";
import { TriangleAlert } from "lucide-react-native";
import { useTheme } from "../../theme";
import AppText from "./AppText";
import AppButton from "./AppButton";

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function AppErrorState({
  title = "Something went wrong",
  message = "We couldn’t load this right now. Please try again.",
  onRetry,
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
      <View
        style={{
          height: 56,
          width: 56,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.dangerSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TriangleAlert color={theme.colors.danger} size={28} />
      </View>
      <AppText variant="heading" style={{ textAlign: "center" }}>
        {title}
      </AppText>
      <AppText variant="body" color="textSecondary" style={{ textAlign: "center" }}>
        {message}
      </AppText>
      {onRetry ? (
        <AppButton size="md" variant="secondary" onPress={onRetry} style={{ marginTop: 4 }}>
          Try again
        </AppButton>
      ) : null}
    </View>
  );
}
