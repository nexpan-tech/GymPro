import { Redirect } from "expo-router";
import { Text, View } from "react-native";
import { useAuthStore } from "../src/stores/auth.store";

export default function Index() {
  const { user, loading, isAuthenticated } = useAuthStore();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#020617",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <View
          style={{
            height: 56,
            width: 56,
            borderRadius: 20,
            backgroundColor: "#4f46e5",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900" }}>
            G
          </Text>
        </View>
        <Text
          style={{
            color: "#818cf8",
            fontSize: 13,
            fontWeight: "800",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Loading…
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  if (user?.role === "MEMBER") {
    return <Redirect href="/member/dashboard" />;
  }

  if (user?.role === "TRAINER") {
    return <Redirect href="/trainer/dashboard" />;
  }

  // Any other authenticated role — show web-only message
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#020617",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <View
        style={{
          height: 72,
          width: 72,
          borderRadius: 26,
          backgroundColor: "#1e293b",
          borderWidth: 1,
          borderColor: "rgba(148,163,184,0.2)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <Text style={{ fontSize: 32 }}>💻</Text>
      </View>

      <Text
        style={{
          color: "#f8fafc",
          fontSize: 24,
          fontWeight: "900",
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        Use the Web Dashboard
      </Text>

      <Text
        style={{
          color: "#94a3b8",
          fontSize: 15,
          lineHeight: 24,
          textAlign: "center",
        }}
      >
        Your account role ({user?.role}) requires the GymPro web dashboard.
        Please visit the web app to continue.
      </Text>
    </View>
  );
}
