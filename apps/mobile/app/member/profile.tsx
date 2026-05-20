import { router } from "expo-router";
import { ArrowLeft, LogOut, Mail, Phone, Target, User } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppCard from "../../src/components/AppCard";
import AppButton from "../../src/components/AppButton";
import { memberService } from "../../src/services/member.service";
import { useAuthStore } from "../../src/store/auth.store";
import type { Member } from "../../src/types/member.types";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await memberService.getMyProfile();
      setMember(profile);
    } catch (error) {
      console.log("Profile load failed", error);
      setMember(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#818cf8" />
      </View>
    );
  }

  const displayName = member?.user?.name || user?.name || "Member";
  const displayEmail = member?.user?.email || user?.email || "N/A";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Header />

      <AppCard style={{ marginBottom: 18 }}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {displayName
              .split(" ")
              .filter(Boolean)
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.role}>GymPro Member</Text>
      </AppCard>

      <View style={{ gap: 12 }}>
        <InfoRow icon={Mail} label="Email" value={displayEmail} />
        <InfoRow icon={Phone} label="Phone" value={member?.phone || "N/A"} />
        <InfoRow
          icon={Target}
          label="Fitness Goal"
          value={member?.fitnessGoal || "Not set"}
        />
        <InfoRow
          icon={User}
          label="Trainer"
          value={member?.trainer?.name || "Not assigned"}
        />
      </View>

      <AppButton
        onPress={handleLogout}
        style={{
          marginTop: 22,
          backgroundColor: "#dc2626",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <LogOut color="#fff" size={20} />
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>
            Logout
          </Text>
        </View>
      </AppButton>
    </ScrollView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft color="#f8fafc" size={22} />
      </TouchableOpacity>

      <View>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Your personal fitness account</Text>
      </View>
    </View>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <AppCard>
      <View style={styles.infoRow}>
        <View style={styles.infoIcon}>
          <Icon color="#818cf8" size={22} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    </AppCard>
  );
}

const styles = {
  screen: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 20, paddingTop: 64, paddingBottom: 40 },
  center: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
    marginBottom: 24,
  },
  backButton: {
    height: 44,
    width: 44,
    borderRadius: 16,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  title: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "900" as const,
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 4,
  },
  avatar: {
    alignSelf: "center" as const,
    height: 86,
    width: 86,
    borderRadius: 30,
    backgroundColor: "#4f46e5",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 16,
  },
  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900" as const,
  },
  name: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900" as const,
    textAlign: "center" as const,
  },
  role: {
    color: "#94a3b8",
    fontWeight: "700" as const,
    textAlign: "center" as const,
    marginTop: 6,
  },
  infoRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
  },
  infoIcon: {
    height: 46,
    width: 46,
    borderRadius: 18,
    backgroundColor: "#1e293b",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  infoLabel: {
    color: "#94a3b8",
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  infoValue: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900" as const,
  },
};