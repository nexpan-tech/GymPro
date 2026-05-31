import { ActivityIndicator, Text, View } from "react-native";

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#818cf8" />
      <Text style={styles.appName}>GymPro</Text>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 16,
  },
  appName: {
    color: "#818cf8",
    fontSize: 22,
    fontWeight: "900" as const,
    letterSpacing: 1.5,
  },
};
