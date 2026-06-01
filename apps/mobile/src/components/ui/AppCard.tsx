import type { ReactNode } from "react";
import { View, type ViewStyle } from "react-native";
import { useTheme } from "../../theme";

interface Props {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: "surface" | "elevated";
  /** Apply default padding (default true). */
  padded?: boolean;
}

export default function AppCard({
  children,
  style,
  variant = "surface",
  padded = true,
}: Props) {
  const { theme } = useTheme();
  const elevated = variant === "elevated";

  return (
    <View
      style={[
        {
          backgroundColor: elevated
            ? theme.colors.surfaceElevated
            : theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.xl,
          padding: padded ? theme.spacing.lg : 0,
        },
        elevated ? theme.shadows.md : theme.shadows.sm,
        style,
      ]}
    >
      {children}
    </View>
  );
}
