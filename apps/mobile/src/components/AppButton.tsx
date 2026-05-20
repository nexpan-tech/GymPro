import { ReactNode } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

interface Props extends TouchableOpacityProps {
  children: ReactNode;
  loading?: boolean;
}

export default function AppButton({
  children,
  loading,
  disabled,
  style,
  ...props
}: Props) {
  return (
    <TouchableOpacity
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        {
          height: 54,
          borderRadius: 18,
          backgroundColor: "#4f46e5",
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled || loading ? 0.7 : 1,
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : typeof children === "string" ? (
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}