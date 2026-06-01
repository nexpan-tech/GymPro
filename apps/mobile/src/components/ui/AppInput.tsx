import { useState } from "react";
import {
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../theme";
import AppText from "./AppText";

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
  containerStyle?: ViewStyle;
}

export default function AppInput({
  label,
  error,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [focused, setFocused] = useState(false);

  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label ? (
        <AppText variant="label" color="textSecondary">
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={c.textMuted}
        style={[
          {
            height: 52,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: error
              ? c.danger
              : focused
                ? c.primary
                : c.border,
            backgroundColor: c.surface,
            color: c.textPrimary,
            paddingHorizontal: theme.spacing.lg,
            fontSize: 15,
            fontWeight: "500",
          },
          style,
        ]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {error ? (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
