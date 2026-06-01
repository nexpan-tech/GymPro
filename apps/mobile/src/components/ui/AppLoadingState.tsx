import { View } from "react-native";
import { useTheme } from "../../theme";
import AppCard from "./AppCard";
import AppSkeleton from "./AppSkeleton";

interface Props {
  /** Number of skeleton card rows to render (default 3). */
  rows?: number;
}

/** Premium skeleton loading placeholder for list/dashboard screens. */
export default function AppLoadingState({ rows = 3 }: Props) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: theme.spacing.lg }}>
      {Array.from({ length: rows }).map((_, i) => (
        <AppCard key={i} style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <AppSkeleton width={44} height={44} radius={theme.radius.md} />
            <View style={{ flex: 1, gap: 8 }}>
              <AppSkeleton width="60%" height={14} />
              <AppSkeleton width="40%" height={12} />
            </View>
          </View>
          <AppSkeleton width="100%" height={12} />
          <AppSkeleton width="80%" height={12} />
        </AppCard>
      ))}
    </View>
  );
}
