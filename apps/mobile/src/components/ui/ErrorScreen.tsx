import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  title: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorScreen({ title, message, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Text style={styles.icon}>!</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.85}>
          <Text style={styles.retryLabel}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 32,
    gap: 16,
  },
  iconWrapper: {
    height: 72,
    width: 72,
    borderRadius: 36,
    backgroundColor: "rgba(239,68,68,0.15)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 8,
  },
  icon: {
    color: "#ef4444",
    fontSize: 36,
    fontWeight: "900" as const,
  },
  title: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "900" as const,
    textAlign: "center" as const,
  },
  message: {
    color: "#94a3b8",
    fontSize: 15,
    textAlign: "center" as const,
    lineHeight: 23,
  },
  retryButton: {
    marginTop: 8,
    height: 54,
    paddingHorizontal: 40,
    borderRadius: 18,
    backgroundColor: "#4f46e5",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  retryLabel: {
    color: "#fff",
    fontWeight: "900" as const,
    fontSize: 15,
  },
};
