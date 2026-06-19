import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { CalendarCheck } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { attendanceService } from "../../src/services/attendance.service";
import { memberService, type MemberStreak } from "../../src/services/member.service";
import { enqueueScan, isOfflineError, pendingCount, syncPending } from "../../src/utils/offline-attendance";
import type { Attendance } from "../../src/types/attendance.types";
import { useTheme, type Theme } from "../../src/theme";
import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppStatCard,
  AppText,
} from "../../src/components/ui";

type ScanStatus = "idle" | "processing" | "success" | "already" | "error" | "offline";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AttendanceScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [permission, requestPermission] = useCameraPermissions();
  const [records, setRecords] = useState<Attendance[]>([]);
  const [streak, setStreak] = useState<MemberStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [alreadyMessage, setAlreadyMessage] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [pending, setPending] = useState(0);
  const scanningRef = useRef(false);

  const loadAttendance = useCallback(async () => {
    try {
      const [data, streakData] = await Promise.all([
        attendanceService.getMyAttendance(),
        memberService.getStreak().catch(() => null),
      ]);
      setRecords(Array.isArray(data) ? data : []);
      setStreak(streakData);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scanningRef.current) return;
      scanningRef.current = true;
      setScanStatus("processing");

      let gymId = data;
      try {
        const parsed = JSON.parse(data) as { gymId?: string };
        if (parsed.gymId) gymId = parsed.gymId;
      } catch {
        // plain string gymId — use as-is
      }

      try {
        await attendanceService.scanQr({ gymId });
        setScanStatus("success");
        void loadAttendance();
      } catch (err: unknown) {
        // Offline → queue the check-in and sync automatically later. (Phase N)
        if (isOfflineError(err)) {
          await enqueueScan("checkin", gymId);
          setPending(await pendingCount());
          setScanStatus("offline");
        } else {
          const msg = err instanceof Error ? err.message : "Something went wrong";
          if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("checked in")) {
            setAlreadyMessage(msg);
            setScanStatus("already");
          } else {
            setErrorMessage(msg);
            setScanStatus("error");
          }
        }
      }

      setTimeout(() => {
        setScanStatus("idle");
        setErrorMessage("");
        setAlreadyMessage("");
        scanningRef.current = false;
      }, 3000);
    },
    [loadAttendance],
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecord = records.find((r) => r.date.slice(0, 10) === todayStr);
  const isCheckedIn = todayRecord?.status === "CHECKED_IN";

  const handleCheckout = useCallback(async () => {
    try {
      setCheckingOut(true);
      await attendanceService.checkout();
      await loadAttendance();
    } catch (err) {
      // Offline → queue the check-out for later sync. (Phase N)
      if (isOfflineError(err) && todayRecord?.gymId) {
        await enqueueScan("checkout", todayRecord.gymId);
        setPending(await pendingCount());
      }
    } finally {
      setCheckingOut(false);
    }
  }, [loadAttendance, todayRecord]);

  // Auto-sync the offline queue on mount + whenever the app returns to foreground.
  useEffect(() => {
    const run = async () => {
      const { synced, remaining } = await syncPending();
      setPending(remaining);
      if (synced > 0) await loadAttendance();
    };
    void run();
    const sub = AppState.addEventListener("change", (st) => { if (st === "active") void run(); });
    return () => sub.remove();
  }, [loadAttendance]);

  if (loading || !permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <AppScreen scroll={false} contentStyle={{ justifyContent: "center" }}>
        <View style={{ alignItems: "center", gap: 16 }}>
          <View style={styles.permIconWrap}>
            <Text style={{ fontSize: 38 }}>📷</Text>
          </View>
          <AppText variant="heading" style={{ textAlign: "center" }}>
            Camera Access Required
          </AppText>
          <AppText variant="body" color="textSecondary" style={{ textAlign: "center" }}>
            Enable camera access to scan QR codes for attendance check-in.
          </AppText>
          {permission.canAskAgain ? (
            <AppButton onPress={() => void requestPermission()}>Allow Camera</AppButton>
          ) : (
            <AppButton onPress={() => void Linking.openSettings()}>Open Settings</AppButton>
          )}
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen
      onRefresh={() => {
        setRefreshing(true);
        void loadAttendance();
      }}
      refreshing={refreshing}
    >
      <AppHeader title="Attendance" subtitle="Scan QR to check in" onBack={() => router.back()} />

      {/* Streak stats — backend operational-day engine (Sundays excluded) */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <AppStatCard label="Current Streak" value={streak?.current ?? 0} tone="primary" />
        <AppStatCard label="Best Streak" value={streak?.best ?? 0} tone="success" />
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <AppStatCard label="Monthly Streak" value={streak?.thisMonth.streak ?? 0} tone="primary" />
        <AppStatCard label="Attendance Rate" value={`${streak?.thisMonth.consistency ?? 0}%`} tone="success" />
      </View>
      <AppText variant="caption" color="textMuted">
        Streaks count operational days only — Sundays don't break your streak.
      </AppText>

      {/* Offline queue indicator (Phase N) */}
      {pending > 0 && (
        <AppCard style={{ borderColor: c.primary }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <ActivityIndicator color={c.primary} size="small" />
            <AppText variant="caption" color="textSecondary" style={{ flex: 1 }}>
              {pending} scan{pending === 1 ? "" : "s"} saved offline — syncing automatically when you're back online.
            </AppText>
          </View>
        </AppCard>
      )}

      {/* Active session → allow checkout */}
      {isCheckedIn && (
        <AppCard>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">You're checked in</AppText>
              <AppText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                Since {todayRecord ? formatTime(todayRecord.checkInAt) : "—"}
              </AppText>
            </View>
            <AppButton
              variant="secondary"
              loading={checkingOut}
              onPress={() => void handleCheckout()}
            >
              Check Out
            </AppButton>
          </View>
        </AppCard>
      )}

      {/* QR Scanner */}
      <AppText variant="heading">Scan QR Code</AppText>
      <View style={styles.scannerWrapper}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={scanStatus === "idle" ? handleBarcodeScanned : undefined}
        />
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        {scanStatus === "processing" && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.overlayText}>Checking in...</Text>
          </View>
        )}
        {scanStatus === "success" && (
          <View style={[styles.overlay, { backgroundColor: "rgba(26,26,26,0.9)" }]}>
            <Text style={styles.overlayEmoji}>✓</Text>
            <Text style={styles.overlayTitle}>Attendance Marked!</Text>
            <Text style={styles.overlayText}>Check-in recorded successfully</Text>
          </View>
        )}
        {scanStatus === "already" && (
          <View style={[styles.overlay, { backgroundColor: "rgba(10,10,10,0.9)" }]}>
            <Text style={styles.overlayEmoji}>ℹ</Text>
            <Text style={styles.overlayTitle}>Already Checked In</Text>
            <Text style={styles.overlayText}>
              {alreadyMessage || "You are already checked in today"}
            </Text>
          </View>
        )}
        {scanStatus === "error" && (
          <View style={[styles.overlay, { backgroundColor: "rgba(161,31,19,0.9)" }]}>
            <Text style={styles.overlayEmoji}>✕</Text>
            <Text style={styles.overlayTitle}>Scan Failed</Text>
            <Text style={styles.overlayText}>{errorMessage || "Unable to process QR code"}</Text>
            <Text style={styles.overlayHint}>Resetting in 3s...</Text>
          </View>
        )}
        {scanStatus === "offline" && (
          <View style={[styles.overlay, { backgroundColor: "rgba(16,16,16,0.92)" }]}>
            <Text style={styles.overlayEmoji}>📥</Text>
            <Text style={styles.overlayTitle}>Saved Offline</Text>
            <Text style={styles.overlayText}>No connection — your check-in is queued and will sync automatically.</Text>
          </View>
        )}
      </View>
      <AppText variant="caption" color="textMuted" style={{ textAlign: "center" }}>
        Point your camera at the gym QR code
      </AppText>

      {/* History */}
      <AppText variant="heading" style={{ marginTop: 12 }}>
        Recent Check-ins
      </AppText>
      <View style={{ gap: 12 }}>
        {records.length > 0 ? (
          records.slice(0, 20).map((item) => (
            <AppCard key={item.id}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View style={styles.recordIcon}>
                  <CalendarCheck color={c.success} size={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong">{formatDate(item.date)}</AppText>
                  <AppText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
                    In {formatTime(item.checkInAt)}
                    {item.checkOutAt ? ` · Out ${formatTime(item.checkOutAt)}` : ""}
                  </AppText>
                </View>
                <AppText
                  variant="caption"
                  style={{ color: item.status === "CHECKED_IN" ? c.success : c.textSecondary }}
                >
                  {item.status === "CHECKED_IN" ? "Inside" : "Present"}
                </AppText>
              </View>
            </AppCard>
          ))
        ) : (
          <AppCard>
            <AppText variant="body" color="textSecondary" style={{ textAlign: "center" }}>
              No attendance records yet.
            </AppText>
          </AppCard>
        )}
      </View>
    </AppScreen>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

function makeStyles(theme: Theme) {
  const c = theme.colors;
  return StyleSheet.create({
    center: {
      flex: 1,
      backgroundColor: c.background,
      alignItems: "center",
      justifyContent: "center",
    },
    permIconWrap: {
      height: 80,
      width: 80,
      borderRadius: 40,
      backgroundColor: c.primarySoft,
      borderWidth: 1,
      borderColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    scannerWrapper: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: theme.radius.xl,
      overflow: "hidden",
      position: "relative",
      backgroundColor: c.surface,
    },
    corner: { position: "absolute", width: CORNER_SIZE, height: CORNER_SIZE },
    cornerTL: {
      top: 16,
      left: 16,
      borderTopWidth: CORNER_THICKNESS,
      borderLeftWidth: CORNER_THICKNESS,
      borderColor: c.primary,
      borderTopLeftRadius: 6,
    },
    cornerTR: {
      top: 16,
      right: 16,
      borderTopWidth: CORNER_THICKNESS,
      borderRightWidth: CORNER_THICKNESS,
      borderColor: c.primary,
      borderTopRightRadius: 6,
    },
    cornerBL: {
      bottom: 16,
      left: 16,
      borderBottomWidth: CORNER_THICKNESS,
      borderLeftWidth: CORNER_THICKNESS,
      borderColor: c.primary,
      borderBottomLeftRadius: 6,
    },
    cornerBR: {
      bottom: 16,
      right: 16,
      borderBottomWidth: CORNER_THICKNESS,
      borderRightWidth: CORNER_THICKNESS,
      borderColor: c.primary,
      borderBottomRightRadius: 6,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(1,0,0,0.88)",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 24,
    },
    overlayEmoji: { fontSize: 48, color: "#fff", fontWeight: "900" },
    overlayTitle: { color: "#ffffff", fontSize: 20, fontWeight: "900", textAlign: "center" },
    overlayText: { color: "#c9c9c9", fontSize: 14, textAlign: "center", lineHeight: 22 },
    overlayHint: { color: "#767676", fontSize: 12, marginTop: 4 },
    recordIcon: {
      height: 46,
      width: 46,
      borderRadius: theme.radius.md,
      backgroundColor: c.successSoft,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
