import { router } from "expo-router";
import { Camera, ImagePlus, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import { memberApi } from "../../src/api/member.api";
import { memberService } from "../../src/services/member.service";
import {
  getMyProgressPhotos,
  deleteProgressPhoto,
  type ProgressPhoto,
} from "../../src/api/progress.api";
import { uploadProgressPhoto } from "../../src/api/upload.api";
import { useTheme, type Theme } from "../../src/theme";
import { AppCard, AppHeader, AppLoadingState, AppScreen, AppText } from "../../src/components/ui";
import type { Member } from "../../src/types/member.types";
import type { Goal } from "../../src/api/member.api";

type Tab = "photos" | "measurements" | "goals";

function useThemedStyles() {
  const { theme } = useTheme();
  return useMemo(() => makeStyles(theme), [theme]);
}

export default function ProgressScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles();

  const [activeTab, setActiveTab] = useState<Tab>("measurements");
  const [member, setMember] = useState<Member | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [profile, fetchedGoals] = await Promise.all([
        memberService.getMyProfile(),
        memberApi.getMyGoals().catch(() => [] as Goal[]),
      ]);
      setMember(profile);
      setGoals(fetchedGoals);
    } catch {
      setMember(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Progress" onBack={() => router.back()} />
        <AppLoadingState rows={3} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppHeader
        title="Progress"
        subtitle="Track your fitness transformation"
        onBack={() => router.back()}
      />

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(["photos", "measurements", "goals"] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { backgroundColor: c.primary }]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab && { color: c.onPrimary, fontWeight: "900" },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "photos" && <PhotosTab />}
      {activeTab === "measurements" && <MeasurementsTab member={member} />}
      {activeTab === "goals" && <GoalsTab goals={goals} />}
    </AppScreen>
  );
}

// ── Photos Tab ────────────────────────────────────────────────────────────────
function PhotosTab() {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles();

  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      const data = await getMyProgressPhotos();
      setPhotos(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpload = useCallback(
    async (fromCamera: boolean) => {
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission needed",
          `Please allow ${fromCamera ? "camera" : "photo library"} access to add a progress photo.`,
        );
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });

      if (result.canceled || result.assets.length === 0) return;

      const uri = result.assets[0].uri;
      setUploading(true);
      try {
        await uploadProgressPhoto(uri);
        await load();
      } catch {
        Alert.alert("Upload failed", "Could not upload your photo. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [load],
  );

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert("Delete photo", "Remove this progress photo?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setPhotos((prev) => prev.filter((p) => p.id !== id));
            try {
              await deleteProgressPhoto(id);
            } catch {
              Alert.alert("Delete failed", "Could not delete the photo.");
              void load();
            }
          },
        },
      ]);
    },
    [load],
  );

  return (
    <View style={{ gap: 16 }}>
      <View style={styles.uploadRow}>
        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
          onPress={() => handleUpload(false)}
          disabled={uploading}
          activeOpacity={0.85}
        >
          <ImagePlus color={c.onPrimary} size={18} />
          <Text style={styles.uploadButtonText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.uploadButtonAlt, uploading && styles.uploadButtonDisabled]}
          onPress={() => handleUpload(true)}
          disabled={uploading}
          activeOpacity={0.85}
        >
          <Camera color={c.primary} size={18} />
          <Text style={styles.uploadButtonAltText}>Camera</Text>
        </TouchableOpacity>
      </View>

      {uploading && (
        <View style={styles.uploadingHint}>
          <ActivityIndicator color={c.primary} size="small" />
          <Text style={styles.uploadingText}>Uploading photo…</Text>
        </View>
      )}

      {loading ? (
        <View style={{ paddingVertical: 32, alignItems: "center" }}>
          <ActivityIndicator color={c.primary} />
        </View>
      ) : error ? (
        <AppCard style={styles.infoCard}>
          <Text style={styles.infoEmoji}>⚠️</Text>
          <AppText variant="heading">Couldn’t load photos</AppText>
          <TouchableOpacity onPress={() => void load()}>
            <AppText variant="bodyStrong" color="primary">
              Tap to retry
            </AppText>
          </TouchableOpacity>
        </AppCard>
      ) : photos.length === 0 ? (
        <AppCard style={styles.infoCard}>
          <Text style={styles.infoEmoji}>📷</Text>
          <AppText variant="heading">No Progress Photos Yet</AppText>
          <AppText variant="body" color="textSecondary" style={{ textAlign: "center" }}>
            Add your first photo from the gallery or camera to start tracking your visual
            transformation.
          </AppText>
        </AppCard>
      ) : (
        <View style={styles.photoGrid}>
          {photos.map((photo) => (
            <View key={photo.id} style={styles.photoItem}>
              <Image source={{ uri: photo.imageUrl }} style={styles.photoImage} />
              <TouchableOpacity
                style={styles.photoDelete}
                onPress={() => handleDelete(photo.id)}
                hitSlop={8}
              >
                <Trash2 color="#fca5a5" size={16} />
              </TouchableOpacity>
              {photo.takenAt && (
                <Text style={styles.photoDate}>
                  {new Date(photo.takenAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  })}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Measurements Tab ──────────────────────────────────────────────────────────
function MeasurementsTab({ member }: { member: Member | null }) {
  const { theme } = useTheme();
  const styles = useThemedStyles();

  const measurements = [
    { label: "Weight", value: member?.weight != null ? `${member.weight} kg` : null, emoji: "⚖️", color: "#2563eb" },
    { label: "Height", value: member?.height != null ? `${member.height} cm` : null, emoji: "📏", color: "#7c3aed" },
    { label: "Fitness Goal", value: member?.fitnessGoal ?? null, emoji: "🎯", color: "#059669" },
    { label: "Gender", value: member?.gender ?? null, emoji: "👤", color: "#d97706" },
  ];
  const hasWeight = member?.weight != null;

  return (
    <View style={{ gap: 16 }}>
      <View style={styles.measureGrid}>
        {measurements.map((m) => (
          <AppCard key={m.label} style={styles.measureCard}>
            <View style={[styles.measureIcon, { backgroundColor: m.color + "22" }]}>
              <Text style={styles.measureEmoji}>{m.emoji}</Text>
            </View>
            <Text style={styles.measureLabel}>{m.label}</Text>
            <Text style={styles.measureValue}>{m.value ?? "Not set"}</Text>
          </AppCard>
        ))}
      </View>

      <AppCard>
        <Text style={styles.cardTitle}>Weight Trend</Text>
        {hasWeight ? (
          <View style={{ gap: 12, marginTop: 12 }}>
            <WeightBar label="Current" value={member!.weight!} max={150} color={theme.colors.primary} />
            <Text style={styles.trendHint}>
              Ask your trainer to log regular weigh-ins to see your trend over time.
            </Text>
          </View>
        ) : (
          <Text style={[styles.trendHint, { marginTop: 10 }]}>
            No weight data recorded yet. Your trainer can update your measurements from the admin
            panel.
          </Text>
        )}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Profile Completion</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: getCompletion(member) }]} />
        </View>
        <Text style={styles.progressLabel}>{getCompletionPct(member)}% complete</Text>
      </AppCard>
    </View>
  );
}

function WeightBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const styles = useThemedStyles();
  const pct = Math.min(100, (value / max) * 100);
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.weightBarHeader}>
        <Text style={styles.weightBarLabel}>{label}</Text>
        <Text style={styles.weightBarValue}>{value} kg</Text>
      </View>
      <View style={styles.weightBarTrack}>
        <View style={[styles.weightBarFill, { width: `${pct}%` as `${number}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function getCompletion(member: Member | null): `${number}%` {
  return `${getCompletionPct(member)}%`;
}

function getCompletionPct(member: Member | null): number {
  if (!member) return 0;
  const fields = [member.weight, member.height, member.fitnessGoal, member.gender, member.dateOfBirth, member.phone];
  const filled = fields.filter((f) => f != null && f !== "").length;
  return Math.round((filled / fields.length) * 100);
}

// ── Goals Tab ─────────────────────────────────────────────────────────────────
function GoalsTab({ goals }: { goals: Goal[] }) {
  const styles = useThemedStyles();
  if (goals.length === 0) {
    return (
      <AppCard style={styles.infoCard}>
        <Text style={styles.infoEmoji}>🎯</Text>
        <AppText variant="heading">No Goals Yet</AppText>
        <AppText variant="body" color="textSecondary" style={{ textAlign: "center" }}>
          Your trainer can set fitness goals for you from the admin panel. Goals will appear here
          with progress tracking.
        </AppText>
      </AppCard>
    );
  }
  return (
    <View style={{ gap: 12 }}>
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
    </View>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles();

  const hasProgress = goal.targetValue != null && goal.currentValue != null && goal.targetValue > 0;
  const pct = hasProgress
    ? Math.min(100, Math.round(((goal.currentValue ?? 0) / (goal.targetValue ?? 1)) * 100))
    : 0;

  const statusColor =
    goal.status === "COMPLETED" ? c.success : goal.status === "CANCELLED" ? c.textMuted : c.primary;
  const statusLabel =
    goal.status === "IN_PROGRESS" ? "In Progress" : goal.status === "COMPLETED" ? "Completed" : "Cancelled";

  return (
    <AppCard>
      <View style={styles.goalHeader}>
        <Text style={styles.goalTitle}>{goal.title}</Text>
        <View style={[styles.goalBadge, { borderColor: statusColor }]}>
          <Text style={[styles.goalBadgeText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {hasProgress && (
        <View style={{ gap: 6, marginTop: 12 }}>
          <View style={styles.goalProgressHeader}>
            <Text style={styles.goalProgressLabel}>
              {goal.currentValue} / {goal.targetValue} {goal.unit ? goal.unit : ""}
            </Text>
            <Text style={styles.goalProgressPct}>{pct}%</Text>
          </View>
          <View style={styles.goalTrack}>
            <View style={[styles.goalFill, { width: `${pct}%` as `${number}%`, backgroundColor: statusColor }]} />
          </View>
        </View>
      )}

      {goal.dueDate && (
        <Text style={styles.goalDue}>
          Due{" "}
          {new Date(goal.dueDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </Text>
      )}
    </AppCard>
  );
}

function makeStyles(theme: Theme) {
  const c = theme.colors;
  return StyleSheet.create({
    tabBar: {
      flexDirection: "row",
      backgroundColor: c.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: 4,
      gap: 4,
    },
    tab: { flex: 1, paddingVertical: 10, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center" },
    tabLabel: { color: c.textMuted, fontSize: 13, fontWeight: "700" },
    infoCard: { alignItems: "center", gap: 12, padding: 28 },
    infoEmoji: { fontSize: 48, marginBottom: 4 },
    measureGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    measureCard: { width: "47%", gap: 8 },
    measureIcon: { height: 44, width: 44, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", marginBottom: 4 },
    measureEmoji: { fontSize: 22 },
    measureLabel: { color: c.textSecondary, fontSize: 12, fontWeight: "700" },
    measureValue: { color: c.textPrimary, fontSize: 18, fontWeight: "900" },
    cardTitle: { color: c.textPrimary, fontSize: 17, fontWeight: "900" },
    weightBarHeader: { flexDirection: "row", justifyContent: "space-between" },
    weightBarLabel: { color: c.textSecondary, fontSize: 13, fontWeight: "700" },
    weightBarValue: { color: c.textPrimary, fontSize: 13, fontWeight: "900" },
    weightBarTrack: { height: 10, borderRadius: 99, backgroundColor: c.muted, overflow: "hidden" },
    weightBarFill: { height: "100%", borderRadius: 99 },
    trendHint: { color: c.textMuted, fontSize: 13, lineHeight: 20 },
    progressTrack: { height: 14, borderRadius: 99, backgroundColor: c.muted, overflow: "hidden", marginTop: 14 },
    progressFill: { height: "100%", borderRadius: 99, backgroundColor: c.primary },
    progressLabel: { color: c.textSecondary, fontWeight: "700", marginTop: 10, fontSize: 13 },
    goalHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
    goalTitle: { color: c.textPrimary, fontSize: 15, fontWeight: "900", flex: 1 },
    goalBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    goalBadgeText: { fontSize: 11, fontWeight: "900" },
    goalProgressHeader: { flexDirection: "row", justifyContent: "space-between" },
    goalProgressLabel: { color: c.textSecondary, fontSize: 12 },
    goalProgressPct: { color: c.textPrimary, fontSize: 12, fontWeight: "900" },
    goalTrack: { height: 8, borderRadius: 99, backgroundColor: c.muted, overflow: "hidden" },
    goalFill: { height: "100%", borderRadius: 99 },
    goalDue: { color: c.textMuted, fontSize: 12, marginTop: 10 },
    uploadRow: { flexDirection: "row", gap: 12 },
    uploadButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: c.primary,
      borderRadius: theme.radius.md,
      paddingVertical: 12,
    },
    uploadButtonAlt: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: theme.radius.md,
      paddingVertical: 12,
    },
    uploadButtonDisabled: { opacity: 0.5 },
    uploadButtonText: { color: c.onPrimary, fontWeight: "900", fontSize: 14 },
    uploadButtonAltText: { color: c.primary, fontWeight: "900", fontSize: 14 },
    uploadingHint: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
    uploadingText: { color: c.textSecondary, fontSize: 13, fontWeight: "700" },
    photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    photoItem: { width: "47%", aspectRatio: 0.8, borderRadius: theme.radius.lg, overflow: "hidden", backgroundColor: c.surface },
    photoImage: { width: "100%", height: "100%" },
    photoDelete: {
      position: "absolute",
      top: 8,
      right: 8,
      height: 32,
      width: 32,
      borderRadius: theme.radius.sm,
      backgroundColor: "rgba(2,6,23,0.7)",
      alignItems: "center",
      justifyContent: "center",
    },
    photoDate: {
      position: "absolute",
      bottom: 8,
      left: 8,
      color: "#f8fafc",
      fontSize: 11,
      fontWeight: "800",
      backgroundColor: "rgba(2,6,23,0.7)",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
  });
}
