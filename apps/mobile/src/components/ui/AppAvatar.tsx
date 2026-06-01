import { View } from "react-native";
import { useTheme } from "../../theme";
import AppText from "./AppText";

interface Props {
  name?: string | null;
  size?: number;
}

function initials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "?";
}

export default function AppAvatar({ name, size = 48 }: Props) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        height: size,
        width: size,
        borderRadius: size / 3,
        backgroundColor: theme.colors.primarySoft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AppText
        style={{ color: theme.colors.primary, fontSize: size * 0.36, fontWeight: "900" }}
      >
        {initials(name)}
      </AppText>
    </View>
  );
}
