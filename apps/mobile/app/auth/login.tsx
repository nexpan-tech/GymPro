import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAuthStore } from "../../src/stores/auth.store";
import { useTheme } from "../../src/theme";
import { AppButton, AppInput, AppText } from "../../src/components/ui";

export default function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const { theme, isDark } = useTheme();
  const c = theme.colors;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const user = await login({ email: email.trim(), password });

      if (user.role === "MEMBER") {
        router.replace("/member/dashboard");
      } else if (user.role === "TRAINER") {
        router.replace("/trainer/dashboard");
      } else {
        setError(
          "This role requires the web dashboard. Please visit app.gympro.io to continue.",
        );
      }
    } catch (err) {
      const apiMessage = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      const isNetwork =
        (err as { code?: string })?.code === "ERR_NETWORK" ||
        (err as { message?: string })?.message?.toLowerCase().includes("network");

      setError(
        isNetwork
          ? "Can't reach the server. Check your network / EXPO_PUBLIC_API_URL."
          : apiMessage || "Invalid email or password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 28, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={{ alignItems: "center", marginBottom: 44 }}>
          <LinearGradient
            colors={c.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              {
                height: 84,
                width: 84,
                borderRadius: 26,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              },
              theme.shadows.lg,
            ]}
          >
            <AppText style={{ color: "#fff", fontSize: 38, fontWeight: "900" }}>
              G
            </AppText>
          </LinearGradient>

          <AppText variant="overline" color="primary" style={{ marginBottom: 6 }}>
            GymPro Member
          </AppText>
          <AppText variant="display" style={{ textAlign: "center" }}>
            Train. Track.{"\n"}
            <AppText variant="display" color="primary">Transform.</AppText>
          </AppText>
          <AppText
            variant="body"
            color="textSecondary"
            style={{ marginTop: 12, textAlign: "center", maxWidth: 280 }}
          >
            Your progress, your streaks, your wins — all in one place.
          </AppText>
        </View>

        {/* Form */}
        <View style={{ gap: 14 }}>
          <AppInput
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setError(null);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="Email address"
          />
          <AppInput
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setError(null);
            }}
            secureTextEntry
            autoComplete="password"
            placeholder="Password"
          />

          {error ? (
            <View
              style={{
                backgroundColor: c.dangerSoft,
                borderWidth: 1,
                borderColor: c.danger,
                borderRadius: theme.radius.md,
                padding: 14,
              }}
            >
              <AppText variant="body" style={{ color: c.danger }}>
                {error}
              </AppText>
            </View>
          ) : null}

          <AppButton onPress={handleLogin} loading={loading} style={{ marginTop: 4 }}>
            Sign In
          </AppButton>
        </View>

        <AppText
          variant="caption"
          color="textMuted"
          style={{ textAlign: "center", marginTop: 36, lineHeight: 18 }}
        >
          GymPro Member App — for gym members and trainers only.
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
