import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  emoji: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  emoji,
  title,
  description,
  actionLabel,
  onAction,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {actionLabel && onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.buttonLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 32,
    gap: 12,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900" as const,
    textAlign: "center" as const,
  },
  description: {
    color: "#94a3b8",
    fontSize: 15,
    textAlign: "center" as const,
    lineHeight: 23,
  },
  button: {
    marginTop: 12,
    height: 54,
    paddingHorizontal: 36,
    borderRadius: 18,
    backgroundColor: "#4f46e5",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  buttonLabel: {
    color: "#fff",
    fontWeight: "900" as const,
    fontSize: 15,
  },
};
