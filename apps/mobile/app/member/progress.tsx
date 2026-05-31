import { router } from "expo-router";
import { ArrowLeft, Camera, ImagePlus, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import AppCard from "../../src/components/AppCard";
import { memberApi } from "../../src/api/member.api";
import { memberService } from "../../src/services/member.service";
import {
  getMyProgressPhotos,
  deleteProgressPhoto,
  type ProgressPhoto,
} from "../../src/api/progress.api";
import { uploadProgressPhoto } from "../../src/api/upload.api";
import type { Member } from "../../src/types/member.types";
import type { Goal } from "../../src/api/member.api";

type Tab = "photos" | "measurements" | "goals";

export default function ProgressScreen() {
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
      <View style={styles.center}>
        <ActivityIndicator color="#818cf8" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#f8fafc" size={22} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Progress</Text>
            <Text style={styles.subtitle}>Track your fitness transformation</Text>
          </View>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {(["photos", "measurements", "goals"] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab && styles.tabLabelActive,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === "photos" && <PhotosTab />}
        {activeTab === "measurements" && <MeasurementsTab member={member} />}
        {activeTab === "goals" && <GoalsTab goals={goals} />}
      </ScrollView>
    </View>
  );
}

// ------------------------------------------------------------------
// Photos Tab
// ------------------------------------------------------------------
function PhotosTab() {
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
      // Permissions
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
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.7,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.7,
          });

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

  const handleDelete = useCallback((id: string) => {
    Alert.alert("Delete photo", "Remove this progress photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          // Optimistic removal, rollback on failure.
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
  }, [load]);

  return (
    <View style={{ gap: 16 }}>
      {/* Upload actions */}
      <View style={styles.uploadRow}>
        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
          onPress={() => handleUpload(false)}
          disabled={uploading}
          activeOpacity={0.85}
        >
          <ImagePlus color="#fff" size={18} />
          <Text style={styles.uploadButtonText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.uploadButtonAlt, uploading && styles.uploadButtonDisabled]}
          onPress={() => handleUpload(true)}
          disabled={uploading}
          activeOpacity={0.85}
        >
          <Camera color="#818cf8" size={18} />
          <Text style={styles.uploadButtonAltText}>Camera</Text>
        </TouchableOpacity>
      </View>

      {uploading && (
        <View style={styles.uploadingHint}>
          <ActivityIndicator color="#818cf8" size="small" />
          <Text style={styles.uploadingText}>Uploading photo…</Text>
        </View>
      )}

      {loading ? (
        <View style={{ paddingVertical: 32, alignItems: "center" }}>
          <ActivityIndicator color="#818cf8" />
        </View>
      ) : error ? (
        <AppCard style={styles.infoCard}>
          <Text style={styles.infoEmoji}>⚠️</Text>
          <Text style={styles.infoTitle}>Couldn’t load photos</Text>
          <TouchableOpacity onPress={() => void load()}>
            <Text style={[styles.infoDesc, { color: "#818cf8", fontWeight: "800" }]}>
              Tap to retry
            </Text>
          </TouchableOpacity>
        </AppCard>
      ) : photos.length === 0 ? (
        <AppCard style={styles.infoCard}>
          <Text style={styles.infoEmoji}>📷</Text>
          <Text style={styles.infoTitle}>No Progress Photos Yet</Text>
          <Text style={styles.infoDesc}>
            Add your first photo from the gallery or camera to start tracking your
            visual transformation.
          </Text>
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

// ------------------------------------------------------------------
// Measurements Tab
// ------------------------------------------------------------------
function MeasurementsTab({ member }: { member: Member | null }) {
  const measurements = [
    {
      label: "Weight",
      value: member?.weight != null ? `${member.weight} kg` : null,
      emoji: "⚖️",
      color: "#2563eb",
    },
    {
      label: "Height",
      value: member?.height != null ? `${member.height} cm` : null,
      emoji: "📏",
      color: "#7c3aed",
    },
    {
      label: "Fitness Goal",
      value: member?.fitnessGoal ?? null,
      emoji: "🎯",
      color: "#059669",
    },
    {
      label: "Gender",
      value: member?.gender ?? null,
      emoji: "👤",
      color: "#d97706",
    },
  ];

  const hasWeight = member?.weight != null;

  return (
    <View style={{ gap: 16 }}>
      {/* Measurement grid */}
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

      {/* Weight trend section */}
      <AppCard>
        <Text style={styles.cardTitle}>Weight Trend</Text>
        {hasWeight ? (
          <View style={{ gap: 12, marginTop: 12 }}>
            <WeightBar label="Current" value={member!.weight!} max={150} color="#2563eb" />
            <Text style={styles.trendHint}>
              Ask your trainer to log regular weigh-ins to see your trend over time.
            </Text>
          </View>
        ) : (
          <Text style={[styles.trendHint, { marginTop: 10 }]}>
            No weight data recorded yet. Your trainer can update your measurements
            from the admin panel.
          </Text>
        )}
      </AppCard>

      {/* Profile completion */}
      <AppCard>
        <Text style={styles.cardTitle}>Profile Completion</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: getCompletion(member) }]} />
        </View>
        <Text style={styles.progressLabel}>
          {getCompletionPct(member)}% complete
        </Text>
      </AppCard>
    </View>
  );
}

function WeightBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.weightBarHeader}>
        <Text style={styles.weightBarLabel}>{label}</Text>
        <Text style={styles.weightBarValue}>{value} kg</Text>
      </View>
      <View style={styles.weightBarTrack}>
        <View
          style={[
            styles.weightBarFill,
            { width: `${pct}%` as `${number}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

function getCompletion(member: Member | null): `${number}%` {
  return `${getCompletionPct(member)}%`;
}

function getCompletionPct(member: Member | null): number {
  if (!member) return 0;
  const fields = [
    member.weight,
    member.height,
    member.fitnessGoal,
    member.gender,
    member.dateOfBirth,
    member.phone,
  ];
  const filled = fields.filter((f) => f != null && f !== "").length;
  return Math.round((filled / fields.length) * 100);
}

// ------------------------------------------------------------------
// Goals Tab
// ------------------------------------------------------------------
function GoalsTab({ goals }: { goals: Goal[] }) {
  if (goals.length === 0) {
    return (
      <AppCard style={styles.infoCard}>
        <Text style={styles.infoEmoji}>🎯</Text>
        <Text style={styles.infoTitle}>No Goals Yet</Text>
        <Text style={styles.infoDesc}>
          Your trainer can set fitness goals for you from the admin panel. Goals
          will appear here with progress tracking.
        </Text>
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
  const hasProgress =
    goal.targetValue != null && goal.currentValue != null && goal.targetValue > 0;
  const pct = hasProgress
    ? Math.min(100, Math.round(((goal.currentValue ?? 0) / (goal.targetValue ?? 1)) * 100))
    : 0;

  const statusColor =
    goal.status === "COMPLETED"
      ? "#34d399"
      : goal.status === "CANCELLED"
      ? "#94a3b8"
      : "#818cf8";

  const statusLabel =
    goal.status === "IN_PROGRESS"
      ? "In Progress"
      : goal.status === "COMPLETED"
      ? "Completed"
      : "Cancelled";

  return (
    <AppCard>
      <View style={styles.goalHeader}>
        <Text style={styles.goalTitle}>{goal.title}</Text>
        <View style={[styles.goalBadge, { borderColor: statusColor + "66" }]}>
          <Text style={[styles.goalBadgeText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {hasProgress && (
        <View style={{ gap: 6, marginTop: 12 }}>
          <View style={styles.goalProgressHeader}>
            <Text style={styles.goalProgressLabel}>
              {goal.currentValue} / {goal.targetValue}{" "}
              {goal.unit ? goal.unit : ""}
            </Text>
            <Text style={styles.goalProgressPct}>{pct}%</Text>
          </View>
          <View style={styles.goalTrack}>
            <View
              style={[
                styles.goalFill,
                {
                  width: `${pct}%` as `${number}%`,
                  backgroundColor: statusColor,
                },
              ]}
            />
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 20, paddingTop: 64, paddingBottom: 40, gap: 0 },
  center: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "900",
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 4,
  },
  // Tab bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: "#4f46e5",
  },
  tabLabel: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
  },
  tabLabelActive: {
    color: "#fff",
    fontWeight: "900",
  },
  // Info cards (fallback)
  infoCard: {
    alignItems: "center",
    gap: 12,
    padding: 28,
  },
  infoEmoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  infoTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  infoDesc: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  codeBlock: {
    backgroundColor: "#1e293b",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: "100%",
  },
  codeText: {
    color: "#34d399",
    fontSize: 12,
    fontFamily: "monospace",
    textAlign: "center",
  },
  // Measurements
  measureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  measureCard: {
    width: "47%",
    gap: 8,
  },
  measureIcon: {
    height: 44,
    width: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  measureEmoji: {
    fontSize: 22,
  },
  measureLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
  },
  measureValue: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "900",
  },
  // Weight bar
  weightBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weightBarLabel: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "700",
  },
  weightBarValue: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "900",
  },
  weightBarTrack: {
    height: 10,
    borderRadius: 99,
    backgroundColor: "#1e293b",
    overflow: "hidden",
  },
  weightBarFill: {
    height: "100%",
    borderRadius: 99,
  },
  trendHint: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 20,
  },
  // Progress bar
  progressTrack: {
    height: 14,
    borderRadius: 99,
    backgroundColor: "#1e293b",
    overflow: "hidden",
    marginTop: 14,
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
    backgroundColor: "#4f46e5",
  },
  progressLabel: {
    color: "#94a3b8",
    fontWeight: "700",
    marginTop: 10,
    fontSize: 13,
  },
  // Goals
  goalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  goalTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900",
    flex: 1,
  },
  goalBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  goalBadgeText: {
    fontSize: 11,
    fontWeight: "900",
  },
  goalProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  goalProgressLabel: {
    color: "#94a3b8",
    fontSize: 12,
  },
  goalProgressPct: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "900",
  },
  goalTrack: {
    height: 8,
    borderRadius: 99,
    backgroundColor: "#1e293b",
    overflow: "hidden",
  },
  goalFill: {
    height: "100%",
    borderRadius: 99,
  },
  goalDue: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 10,
  },
  // Progress photos
  uploadRow: {
    flexDirection: "row",
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4f46e5",
    borderRadius: 14,
    paddingVertical: 12,
  },
  uploadButtonAlt: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.4)",
    borderRadius: 14,
    paddingVertical: 12,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
  },
  uploadButtonAltText: {
    color: "#818cf8",
    fontWeight: "900",
    fontSize: 14,
  },
  uploadingHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  uploadingText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "700",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoItem: {
    width: "47%",
    aspectRatio: 0.8,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#0f172a",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoDelete: {
    position: "absolute",
    top: 8,
    right: 8,
    height: 32,
    width: 32,
    borderRadius: 10,
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
