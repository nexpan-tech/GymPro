import { LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";
import AppCard from "./AppCard";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = "#6366f1",
}: Props) {
  return (
    <AppCard style={{ width: "48%" }}>
      <View
        style={{
          height: 42,
          width: 42,
          borderRadius: 16,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
        }}
      >
        <Icon color="#fff" size={22} />
      </View>

      <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700" }}>
        {label}
      </Text>
      <Text
        style={{
          color: "#f8fafc",
          fontSize: 24,
          fontWeight: "900",
          marginTop: 4,
        }}
      >
        {value}
      </Text>
    </AppCard>
  );
}