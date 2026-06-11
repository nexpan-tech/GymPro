import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { QrCode, ArrowLeft, CircleCheck, CircleX, Flame, RotateCcw } from "lucide-react-native";

import { attendanceService } from "../../src/services/attendance.service";
import type { Attendance } from "../../src/types/attendance.types";
import { useTheme } from "../../src/theme";
import { AppButton, AppScreen, AppText } from "../../src/components/ui";

function isToday(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function currentStreak(records: Attendance[]) {
  if (!records.length) return 0;
  const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (const r of sorted) {
    const d = new Date(r.date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((cursor.getTime() - d.getTime()) / 86_400_000);
    if (diff === 0 || diff === 1) {
      streak++;
      cursor = d;
    } else {
      break;
    }
  }
  return streak;
}

type ScanResult =
  | { type: "success"; title: string; message: string }
  | { type: "error"; title: string; message: string };

export default function ScannerPage() {
  const { theme } = useTheme();
  const c = theme.colors;

  const params = useLocalSearchParams<{ action?: string }>();
  const action = params.action === "checkout" ? "checkout" : "checkin";

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [impact, setImpact] = useState<{ streak: number; sessions: number } | null>(null);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (permission && !permission.granted && !permission.canAskAgain) {
      console.warn("[scanner] camera permission denied permanently — open settings to enable");
    }
  }, [permission]);

  async function handleAllowCamera() {
    if (permission && !permission.canAskAgain) {
      await Linking.openSettings();
      return;
    }
    const res = await requestPermission();
    if (!res.granted) {
      console.warn("[scanner] camera permission request was denied");
    }
  }

  // Best-effort read of attendance to show real streak impact (no logic change).
  async function loadImpact() {
    try {
      const records = await attendanceService.getMyAttendance();
      const arr = Array.isArray(records) ? records : [];
      setImpact({
        streak: currentStreak(arr),
        sessions: arr.filter((r) => isToday(r.date)).length || arr.length,
      });
    } catch {
      /* impact is a bonus — ignore failures */
    }
  }

  async function handleScan(data: string) {
    if (scanned || loading) return;

    try {
      setScanned(true);
      setLoading(true);

      // Accept all gym QR formats: "gym:<gymId>", raw "<gymId>", or JSON { gymId }.
      let gymId = data.trim();
      if (gymId.startsWith("gym:")) {
        gymId = gymId.slice(4);
      } else if (gymId.startsWith("{")) {
        try {
          const parsed = JSON.parse(gymId) as { gymId?: string };
          gymId = parsed.gymId ?? "";
        } catch {
          gymId = "";
        }
      }

      if (!gymId) {
        console.warn("[scanner] invalid QR payload:", data);
        setResult({ type: "error", title: "Invalid QR code", message: "That code isn't a valid gym code. Make sure you're scanning your gym's QR." });
        setScanned(false);
        setLoading(false);
        return;
      }

      if (action === "checkout") {
        await attendanceService.checkout({ gymId });
        setResult({ type: "success", title: "Checked out", message: "Great work today. Recovery is where the growth happens — rest up and come back strong." });
      } else {
        await attendanceService.scan(gymId);
        setResult({ type: "success", title: "You're in. Let's go.", message: "Attendance marked. Another session toward the body you're building." });
      }
      void loadImpact();
    } catch (error: any) {
      console.warn(
        `[scanner] attendance ${action} API failed:`,
        error?.response?.status,
        error?.response?.data?.message ?? error?.message,
      );
      setResult({
        type: "error",
        title: action === "checkout" ? "Check-out failed" : "Check-in failed",
        message:
          error?.response?.data?.message ||
          (action === "checkout" ? "Unable to check out. Please try again." : "Unable to mark attendance. Please try again."),
      });
      setScanned(false);
    } finally {
      setLoading(false);
    }
  }

  function retry() {
    setResult(null);
    setImpact(null);
    setScanned(false);
  }

  if (!permission) {
    return (
      <View style={[styles.centered, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  // ── Result overlay — premium in-app success / failure state ────────────────
  if (result) {
    const ok = result.type === "success";
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={ok ? ["#1a1a1a", "#010000"] : ["#161616", "#010000"]}
          style={StyleSheet.absoluteFillObject}
        />
        {ok ? (
          <View
            style={{
              position: "absolute",
              top: "18%",
              alignSelf: "center",
              height: 240,
              width: 240,
              borderRadius: 999,
              backgroundColor: c.primary,
              opacity: 0.16,
            }}
          />
        ) : null}
        <View style={styles.resultContent}>
          <View
            style={{
              height: 104,
              width: 104,
              borderRadius: 32,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: ok ? c.primary : "rgba(255,255,255,0.08)",
              borderWidth: ok ? 0 : 1,
              borderColor: "rgba(255,255,255,0.15)",
            }}
          >
            {ok ? <CircleCheck color="#FFFFFF" size={56} /> : <CircleX color="#FFFFFF" size={52} />}
          </View>

          <Text style={styles.resultTitle}>{result.title}</Text>
          <Text style={styles.resultMessage}>{result.message}</Text>

          {ok && impact ? (
            <View style={styles.impactRow}>
              <View style={styles.impactPill}>
                <Flame color={c.primary} size={18} />
                <Text style={styles.impactValue}>{impact.streak}</Text>
                <Text style={styles.impactLabel}>day streak</Text>
              </View>
              <View style={styles.impactPill}>
                <CircleCheck color={c.primary} size={18} />
                <Text style={styles.impactValue}>{impact.sessions}</Text>
                <Text style={styles.impactLabel}>logged</Text>
              </View>
            </View>
          ) : null}

          <View style={{ width: "100%", gap: 10, marginTop: 36 }}>
            {ok ? (
              <AppButton onPress={() => router.replace("/member/dashboard")} fullWidth>
                Back to dashboard
              </AppButton>
            ) : (
              <AppButton onPress={retry} icon={<RotateCcw color="#FFFFFF" size={16} />} fullWidth>
                Scan again
              </AppButton>
            )}
            <AppButton variant="secondary" onPress={() => router.replace("/member/dashboard")} fullWidth>
              {ok ? "Done" : "Go back"}
            </AppButton>
          </View>
        </View>
      </View>
    );
  }

  // Themed permission screen
  if (!permission.granted) {
    return (
      <AppScreen scroll={false} contentStyle={{ justifyContent: "center", alignItems: "center", gap: 16 }}>
        <View
          style={{
            height: 96,
            width: 96,
            borderRadius: theme.radius.xl,
            backgroundColor: c.primarySoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <QrCode color={c.primary} size={56} />
        </View>
        <AppText variant="heading" style={{ textAlign: "center" }}>
          Camera Permission Required
        </AppText>
        <AppText variant="body" color="textSecondary" style={{ textAlign: "center" }}>
          {permission.canAskAgain
            ? "Enable camera access to scan gym QR codes."
            : "Camera access is blocked. Open Settings to enable it for GymPro, then return to scan."}
        </AppText>
        <AppButton onPress={() => void handleAllowCamera()} style={{ marginTop: 8 }}>
          {permission.canAskAgain ? "Allow Camera" : "Open Settings"}
        </AppButton>
        <AppButton variant="secondary" onPress={() => router.back()}>
          Go Back
        </AppButton>
      </AppScreen>
    );
  }

  // Camera viewfinder — intentionally dark overlay in both themes (standard QR UX).
  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={"back" as CameraType}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={
          scanned ? undefined : (event: { data: string }) => void handleScan(event.data)
        }
      />

      <LinearGradient
        colors={["rgba(1,0,0,0.92)", "transparent", "rgba(1,0,0,0.95)"]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#fff" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {action === "checkout" ? "Check Out" : "Check In"}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {action === "checkout" ? "Scan to finish strong" : "Scan to start your session"}
        </Text>
        <Text style={styles.subtitle}>
          {action === "checkout"
            ? "Line up the gym QR to mark your exit"
            : "Line up the gym QR — your streak is counting on you"}
        </Text>

        <View style={styles.scanFrameWrapper}>
          <View style={[styles.corner, styles.cornerTL, { borderColor: c.primary }]} />
          <View style={[styles.corner, styles.cornerTR, { borderColor: c.primary }]} />
          <View style={[styles.corner, styles.cornerBL, { borderColor: c.primary }]} />
          <View style={[styles.corner, styles.cornerBR, { borderColor: c.primary }]} />
        </View>

        {loading && (
          <View style={styles.statusBox}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.statusText}>Marking attendance...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const FRAME_SIZE = 260;
const CORNER = 36;
const THICK = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#010000" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(1,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  content: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  title: { color: "#fff", fontSize: 26, fontWeight: "800", textAlign: "center" },
  subtitle: { color: "#c9c9c9", fontSize: 15, textAlign: "center", marginTop: 12, lineHeight: 22 },
  scanFrameWrapper: { marginTop: 48, width: FRAME_SIZE, height: FRAME_SIZE },
  corner: { position: "absolute", width: CORNER, height: CORNER },
  cornerTL: { top: 0, left: 0, borderTopWidth: THICK, borderLeftWidth: THICK, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderTopWidth: THICK, borderRightWidth: THICK, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: THICK, borderLeftWidth: THICK, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: THICK, borderRightWidth: THICK, borderBottomRightRadius: 12 },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 40,
    backgroundColor: "rgba(1,0,0,0.8)",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  statusText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  resultContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 28 },
  resultTitle: { color: "#fff", fontSize: 28, fontWeight: "900", textAlign: "center", marginTop: 28, letterSpacing: -0.5 },
  resultMessage: { color: "#c9c9c9", fontSize: 15, textAlign: "center", marginTop: 12, lineHeight: 22, maxWidth: 320 },
  impactRow: { flexDirection: "row", gap: 12, marginTop: 28 },
  impactPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  impactValue: { color: "#fff", fontSize: 20, fontWeight: "900" },
  impactLabel: { color: "#8f8f8f", fontSize: 12, fontWeight: "700" },
});
