import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuthStore } from "../../src/stores/auth.store";

export default function LoginScreen() {
  const login = useAuthStore((state) => state.login);

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
          "This role requires the web dashboard. Please visit app.gympro.io to continue."
        );
      }
    } catch (error) {
      // TEMP DIAGNOSTIC: surface the real error + stack so the exact failing
      // module shows up in the Metro console (remove once the cause is found).
      console.error("LOGIN_ERROR_FULL", error);
      console.error(
        "LOGIN_ERROR_STACK",
        error instanceof Error ? error.stack : undefined,
      );

      const apiMessage = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      const isNetwork =
        (error as { code?: string })?.code === "ERR_NETWORK" ||
        (error as { message?: string })?.message
          ?.toLowerCase()
          .includes("network");

      setError(
        isNetwork
          ? "Can't reach the server. Check EXPO_PUBLIC_API_URL / network."
          : apiMessage || "Invalid email or password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#020617" }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 28,
          justifyContent: "center",
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / Brand */}
        <View style={{ alignItems: "center", marginBottom: 48 }}>
          <View
            style={{
              height: 80,
              width: 80,
              borderRadius: 28,
              backgroundColor: "#4f46e5",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              shadowColor: "#4f46e5",
              shadowOpacity: 0.5,
              shadowRadius: 24,
              elevation: 10,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 36, fontWeight: "900" }}>
              G
            </Text>
          </View>

          <Text
            style={{
              color: "#f8fafc",
              fontSize: 40,
              fontWeight: "900",
              letterSpacing: -1,
            }}
          >
            GymPro
          </Text>

          <Text
            style={{
              color: "#94a3b8",
              fontSize: 15,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            Your personal fitness command center
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: 14 }}>
          <TextInput
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setError(null);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="Email address"
            placeholderTextColor="#475569"
            style={{
              height: 58,
              borderRadius: 20,
              backgroundColor: "#0f172a",
              borderWidth: 1,
              borderColor: "rgba(148,163,184,0.2)",
              color: "#f8fafc",
              paddingHorizontal: 20,
              fontSize: 15,
            }}
          />

          <TextInput
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setError(null);
            }}
            secureTextEntry
            autoComplete="password"
            placeholder="Password"
            placeholderTextColor="#475569"
            style={{
              height: 58,
              borderRadius: 20,
              backgroundColor: "#0f172a",
              borderWidth: 1,
              borderColor: "rgba(148,163,184,0.2)",
              color: "#f8fafc",
              paddingHorizontal: 20,
              fontSize: 15,
            }}
          />

          {error && (
            <View
              style={{
                backgroundColor: "rgba(239,68,68,0.12)",
                borderWidth: 1,
                borderColor: "rgba(239,68,68,0.3)",
                borderRadius: 16,
                padding: 14,
              }}
            >
              <Text
                style={{ color: "#f87171", fontSize: 14, lineHeight: 20 }}
              >
                {error}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            style={{
              height: 58,
              borderRadius: 20,
              backgroundColor: "#4f46e5",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 8,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "900",
                }}
              >
                Sign In
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text
          style={{
            color: "#475569",
            fontSize: 12,
            textAlign: "center",
            marginTop: 36,
            lineHeight: 18,
          }}
        >
          GymPro Member App — for gym members and trainers only.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
