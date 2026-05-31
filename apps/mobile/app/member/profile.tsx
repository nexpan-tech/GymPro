import { router } from "expo-router";
import {
  Building2,
  LogOut,
  Mail,
  Phone,
  Target,
  User,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  View,
} from "react-native";

import AppCard from "../../src/components/AppCard";
import AppButton from "../../src/components/AppButton";
import { memberService } from "../../src/services/member.service";
import { membershipService } from "../../src/services/membership.service";
import { useAuthStore } from "../../src/stores/auth.store";
import type { Member } from "../../src/types/member.types";

// App version — update via package.json in real usage
const APP_VERSION = "1.0.0";

// ─── screen ──────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const [member, setMember] = useState<Member | null>(null);
  const [membership, setMembership] = useState<Awaited<
    ReturnType<typeof membershipService.getMyMembership>
  > | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await memberService.getMyProfile();
      setMember(profile);

      const mem = await membershipService.getMyMembership();
      setMembership(mem);
    } catch (err) {
      console.log("Profile load failed", err);
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
          router.replace("/auth/login");
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  const displayName = member?.user?.name || user?.name || "Member";
  const displayEmail = member?.user?.email || user?.email || "—";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const statusColor =
    membership?.status === "ACTIVE"
      ? "#34d399"
      : membership?.status === "EXPIRED"
      ? "#f87171"
      : "#f59e0b";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Title */}
      <View style={{ marginBottom: 24 }}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Your personal fitness account</Text>
      </View>

      {/* Avatar card */}
      <AppCard style={{ alignItems: "center", marginBottom: 20, paddingVertical: 28 }}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.roleLabel}>GymPro Member</Text>
      </AppCard>

      {/* Personal info */}
      <Text style={styles.sectionLabel}>Personal Info</Text>
      <View style={{ gap: 10, marginBottom: 20 }}>
        <InfoRow icon={Mail} label="Email" value={displayEmail} />
        <InfoRow
          icon={Phone}
          label="Phone"
          value={member?.phone || "Not set"}
        />
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
        {user?.gymId && (
          <InfoRow icon={Building2} label="Gym ID" value={user.gymId} />
        )}
      </View>

      {/* Membership info */}
      {membership && (
        <>
          <Text style={styles.sectionLabel}>Membership</Text>
          <AppCard style={{ marginBottom: 20 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text
                style={{ color: "#f8fafc", fontWeight: "900", fontSize: 16 }}
              >
                {membership.name}
              </Text>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 10,
                  backgroundColor: `${statusColor}18`,
                  borderWidth: 1,
                  borderColor: `${statusColor}40`,
                }}
              >
                <Text
                  style={{
                    color: statusColor,
                    fontWeight: "800",
                    fontSize: 12,
                  }}
                >
                  {membership.status}
                </Text>
              </View>
            </View>

            <View style={{ gap: 6 }}>
              {membership.startDate && (
                <MembershipRow
                  label="Start"
                  value={new Date(membership.startDate).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" }
                  )}
                />
              )}
              {membership.endDate && (
                <MembershipRow
                  label="Expires"
                  value={new Date(membership.endDate).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" }
                  )}
                />
              )}
            </View>
          </AppCard>
        </>
      )}

      {/* Settings / Actions */}
      <Text style={styles.sectionLabel}>Settings</Text>
      <AppButton
        onPress={handleLogout}
        style={{ backgroundColor: "#dc2626", marginBottom: 36 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <LogOut color="#fff" size={20} />
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>
            Logout
          </Text>
        </View>
      </AppButton>

      {/* App version footer */}
      <Text
        style={{
          color: "#334155",
          fontSize: 12,
          textAlign: "center",
          fontWeight: "600",
        }}
      >
        GymPro Member App v{APP_VERSION}
      </Text>
    </ScrollView>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────────

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
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View
          style={{
            height: 44,
            width: 44,
            borderRadius: 16,
            backgroundColor: "#1e293b",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon color="#818cf8" size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#64748b", fontSize: 12, fontWeight: "700" }}>
            {label}
          </Text>
          <Text
            style={{
              color: "#f8fafc",
              fontSize: 15,
              fontWeight: "800",
              marginTop: 2,
            }}
          >
            {value}
          </Text>
        </View>
      </View>
    </AppCard>
  );
}

function MembershipRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{ flexDirection: "row", justifyContent: "space-between" }}
    >
      <Text style={{ color: "#64748b", fontSize: 13, fontWeight: "700" }}>
        {label}
      </Text>
      <Text style={{ color: "#f8fafc", fontSize: 13, fontWeight: "800" }}>
        {value}
      </Text>
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = {
  screen: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 20, paddingTop: 64, paddingBottom: 40 },
  center: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  title: { color: "#f8fafc", fontSize: 26, fontWeight: "900" as const },
  subtitle: { color: "#94a3b8", marginTop: 4, fontSize: 13 },
  sectionLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "800" as const,
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
    marginBottom: 10,
  },
  avatar: {
    height: 86,
    width: 86,
    borderRadius: 30,
    backgroundColor: "#4f46e5",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 16,
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "900" as const },
  name: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "900" as const,
    textAlign: "center" as const,
  },
  roleLabel: {
    color: "#94a3b8",
    fontWeight: "700" as const,
    textAlign: "center" as const,
    marginTop: 6,
    fontSize: 13,
  },
};
