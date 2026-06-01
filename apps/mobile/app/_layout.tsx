import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useAuthStore } from "../src/stores/auth.store";
import { authEvents } from "../src/api/client";
import { ThemeProvider, useTheme } from "../src/theme";

function RootStack() {
  const { theme } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}

export default function RootLayout() {
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // When a token refresh fails (expired/invalid refresh token), route to login.
  useEffect(() => {
    const off = authEvents.on("SESSION_EXPIRED", () => {
      router.replace("/auth/login");
    });
    return off;
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootStack />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
