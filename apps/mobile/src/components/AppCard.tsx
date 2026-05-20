import { ReactNode } from "react";
import { View, ViewStyle } from "react-native";

interface Props {
  children: ReactNode;
  style?: ViewStyle;
}

export default function AppCard({ children, style }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: "#0f172a",
          borderWidth: 1,
          borderColor: "rgba(148,163,184,0.18)",
          borderRadius: 24,
          padding: 18,
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 20,
          elevation: 6,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}