import { Text, type TextProps, type TextStyle } from "react-native";
import { useTheme } from "../../theme";
import type { TypographyVariant } from "../../theme/typography";
import type { ThemeColors } from "../../theme/colors";

type ColorToken = Extract<
  keyof ThemeColors,
  | "textPrimary"
  | "textSecondary"
  | "textMuted"
  | "textInverse"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "onPrimary"
>;

interface Props extends TextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
  style?: TextStyle | TextStyle[];
}

export default function AppText({
  variant = "body",
  color = "textPrimary",
  style,
  children,
  ...props
}: Props) {
  const { theme } = useTheme();
  return (
    <Text
      style={[theme.typography[variant], { color: theme.colors[color] }, style]}
      {...props}
    >
      {children}
    </Text>
  );
}
