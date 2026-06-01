import { Redirect } from "expo-router";
import { View } from "react-native";
import { useAuthStore } from "../src/stores/auth.store";
import { useTheme } from "../src/theme";
import { AppText } from "../src/components/ui";

export default function Index() {
  const { user, loading, isAuthenticated } = useAuthStore();
  const { theme } = useTheme();
  const c = theme.colors;

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: c.background,
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <View
          style={{
            height: 56,
            width: 56,
            borderRadius: theme.radius.lg,
            backgroundColor: c.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppText style={{ color: "#fff", fontSize: 22, fontWeight: "900" }}>G</AppText>
        </View>
        <AppText variant="overline" color="primary">
          Loading…
        </AppText>
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
        backgroundColor: c.background,
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <View
        style={{
          height: 72,
          width: 72,
          borderRadius: theme.radius.xl,
          backgroundColor: c.surfaceElevated,
          borderWidth: 1,
          borderColor: c.border,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <AppText style={{ fontSize: 32 }}>💻</AppText>
      </View>
      <AppText variant="title" style={{ textAlign: "center", marginBottom: 12 }}>
        Use the Web Dashboard
      </AppText>
      <AppText variant="body" color="textSecondary" style={{ textAlign: "center" }}>
        Your account role ({user?.role}) requires the GymPro web dashboard. Please visit the web app
        to continue.
      </AppText>
    </View>
  );
}
