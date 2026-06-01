import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
  type TouchableOpacityProps,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../theme";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Props extends TouchableOpacityProps {
  children: ReactNode;
  loading?: boolean;
  variant?: Variant;
  size?: Size;
  /** Optional leading icon element. */
  icon?: ReactNode;
  fullWidth?: boolean;
}

const HEIGHTS: Record<Size, number> = { sm: 40, md: 48, lg: 54 };

export default function AppButton({
  children,
  loading,
  disabled,
  variant = "primary",
  size = "lg",
  icon,
  fullWidth,
  style,
  ...props
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const bg: Record<Variant, string> = {
    primary: c.primary,
    secondary: c.surfaceElevated,
    ghost: "transparent",
    danger: c.danger,
  };
  const fg: Record<Variant, string> = {
    primary: c.onPrimary,
    secondary: c.textPrimary,
    ghost: c.primary,
    danger: "#FFFFFF",
  };

  const containerStyle: ViewStyle = {
    height: HEIGHTS[size],
    borderRadius: theme.radius.lg,
    backgroundColor: bg[variant],
    borderWidth: variant === "ghost" || variant === "secondary" ? 1 : 0,
    borderColor: variant === "ghost" ? c.border : c.border,
    paddingHorizontal: theme.spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? "100%" : undefined,
  };

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[containerStyle, style]}
      accessibilityRole="button"
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          {typeof children === "string" ? (
            <Text
              style={{
                color: fg[variant],
                fontWeight: "800",
                fontSize: size === "sm" ? 13 : 15,
              }}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </>
      )}
    </TouchableOpacity>
  );
}
