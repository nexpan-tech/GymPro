import { router } from "expo-router";
import { Building2, LogOut, Mail, Phone, Target, User } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";

import { memberService } from "../../src/services/member.service";
import { membershipService } from "../../src/services/membership.service";
import { useAuthStore } from "../../src/stores/auth.store";
import { useTheme } from "../../src/theme";
import {
  AppAvatar,
  AppBadge,
  AppButton,
  AppCard,
  AppScreen,
  AppText,
  ThemeToggle,
} from "../../src/components/ui";
import type { Member } from "../../src/types/member.types";

const APP_VERSION = "1.0.0";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { theme } = useTheme();
  const c = theme.colors;

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
      <View
        style={{
          flex: 1,
          backgroundColor: c.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  const displayName = member?.user?.name || user?.name || "Member";
  const displayEmail = member?.user?.email || user?.email || "—";

  const statusTone =
    membership?.status === "ACTIVE"
      ? "success"
      : membership?.status === "EXPIRED"
        ? "danger"
        : "warning";

  return (
    <AppScreen>
      <View style={{ marginBottom: 8 }}>
        <AppText variant="title">Profile</AppText>
        <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
          Your personal fitness account
        </AppText>
      </View>

      {/* Avatar card */}
      <AppCard variant="elevated" style={{ alignItems: "center", paddingVertical: 28, gap: 12 }}>
        <AppAvatar name={displayName} size={86} />
        <AppText variant="heading" style={{ textAlign: "center" }}>
          {displayName}
        </AppText>
        <AppText variant="caption" color="textSecondary">
          GymPro Member
        </AppText>
      </AppCard>

      {/* Personal info */}
      <AppText variant="overline" color="textMuted">
        Personal Info
      </AppText>
      <View style={{ gap: 10 }}>
        <InfoRow icon={Mail} label="Email" value={displayEmail} />
        <InfoRow icon={Phone} label="Phone" value={member?.phone || "Not set"} />
        <InfoRow icon={Target} label="Fitness Goal" value={member?.fitnessGoal || "Not set"} />
        <InfoRow icon={User} label="Trainer" value={member?.trainer?.name || "Not assigned"} />
        {user?.gymId ? <InfoRow icon={Building2} label="Gym ID" value={user.gymId} /> : null}
      </View>

      {/* Membership */}
      {membership ? (
        <>
          <AppText variant="overline" color="textMuted">
            Membership
          </AppText>
          <AppCard>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <AppText variant="subtitle">{membership.planRef?.name ?? membership.plan ?? "Membership"}</AppText>
              <AppBadge label={membership.status ?? "UNKNOWN"} tone={statusTone} />
            </View>
            <View style={{ gap: 6 }}>
              {membership.startDate ? (
                <MembershipRow
                  label="Start"
                  value={new Date(membership.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                />
              ) : null}
              {membership.endDate ? (
                <MembershipRow
                  label="Expires"
                  value={new Date(membership.endDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                />
              ) : null}
            </View>
          </AppCard>
        </>
      ) : null}

      {/* Appearance */}
      <AppText variant="overline" color="textMuted">
        Appearance
      </AppText>
      <AppCard>
        <ThemeToggle />
      </AppCard>

      {/* Settings */}
      <AppText variant="overline" color="textMuted">
        Settings
      </AppText>
      <AppButton variant="danger" onPress={handleLogout} icon={<LogOut color="#fff" size={20} />}>
        Logout
      </AppButton>

      <AppText
        variant="caption"
        color="textMuted"
        style={{ textAlign: "center", marginTop: 8 }}
      >
        GymPro Member App v{APP_VERSION}
      </AppText>
    </AppScreen>
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
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <AppCard>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View
          style={{
            height: 44,
            width: 44,
            borderRadius: theme.radius.md,
            backgroundColor: c.primarySoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon color={c.primary} size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="caption" color="textMuted">
            {label}
          </AppText>
          <AppText variant="bodyStrong" style={{ marginTop: 2 }}>
            {value}
          </AppText>
        </View>
      </View>
    </AppCard>
  );
}

function MembershipRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
      <AppText variant="caption" color="textPrimary">
        {value}
      </AppText>
    </View>
  );
}
