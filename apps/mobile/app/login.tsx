import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../src/store/auth.store";

export default function LoginScreen() {
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("member@titan.com");
  const [password, setPassword] = useState("Admin@123");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      setLoading(true);

      const user = await login({
        email: email.trim(),
        password,
      });

      if (user.role !== "MEMBER") {
        Alert.alert("Access denied", "This mobile app is for members only.");
        return;
      }

      router.replace("/member/dashboard");
    } catch {
      Alert.alert("Login failed", "Please check your email and password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{
        flex: 1,
        backgroundColor: "#020617",
        padding: 24,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          marginBottom: 36,
        }}
      >
        <Text
          style={{
            color: "#818cf8",
            fontSize: 14,
            fontWeight: "800",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          GymPro Member
        </Text>

        <Text
          style={{
            color: "#f8fafc",
            fontSize: 38,
            fontWeight: "900",
            marginTop: 10,
          }}
        >
          Welcome back
        </Text>

        <Text
          style={{
            color: "#94a3b8",
            fontSize: 15,
            lineHeight: 24,
            marginTop: 10,
          }}
        >
          Login to view your attendance, membership, workout and diet plans.
        </Text>
      </View>

      <View style={{ gap: 14 }}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor="#64748b"
          style={{
            height: 56,
            borderRadius: 18,
            backgroundColor: "#0f172a",
            borderWidth: 1,
            borderColor: "rgba(148,163,184,0.2)",
            color: "#f8fafc",
            paddingHorizontal: 18,
            fontSize: 15,
          }}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
          placeholderTextColor="#64748b"
          style={{
            height: 56,
            borderRadius: 18,
            backgroundColor: "#0f172a",
            borderWidth: 1,
            borderColor: "rgba(148,163,184,0.2)",
            color: "#f8fafc",
            paddingHorizontal: 18,
            fontSize: 15,
          }}
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={{
            height: 56,
            borderRadius: 18,
            backgroundColor: "#4f46e5",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 6,
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
              Login
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}