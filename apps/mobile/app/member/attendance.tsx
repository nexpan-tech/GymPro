import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { ArrowLeft, CalendarCheck } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppCard from "../../src/components/AppCard";
import { attendanceService } from "../../src/services/attendance.service";
import type { Attendance } from "../../src/types/attendance.types";

type ScanStatus = "idle" | "processing" | "success" | "already" | "error";

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
  const [permission, requestPermission] = useCameraPermissions();
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [alreadyMessage, setAlreadyMessage] = useState("");
  const scanningRef = useRef(false);

  const loadAttendance = useCallback(async () => {
    try {
      const data = await attendanceService.getMyAttendance();
      setRecords(Array.isArray(data) ? data : []);
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

      try {
        // QR data may be a raw gymId or a JSON payload
        let gymId = data;
        try {
          const parsed = JSON.parse(data) as { gymId?: string };
          if (parsed.gymId) gymId = parsed.gymId;
        } catch {
          // plain string gymId — use as-is
        }

        await attendanceService.scanQr({ gymId });
        setScanStatus("success");
        void loadAttendance();
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Something went wrong";

        if (
          msg.toLowerCase().includes("already") ||
          msg.toLowerCase().includes("checked in")
        ) {
          setAlreadyMessage(msg);
          setScanStatus("already");
        } else {
          setErrorMessage(msg);
          setScanStatus("error");
        }
      }

      // Auto-reset after 3 seconds
      setTimeout(() => {
        setScanStatus("idle");
        setErrorMessage("");
        setAlreadyMessage("");
        scanningRef.current = false;
      }, 3000);
    },
    [loadAttendance]
  );

  const thisMonthCount = records.filter((item) => {
    const now = new Date();
    const date = new Date(item.date);
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#818cf8" />
      </View>
    );
  }

  // Permission not yet determined — request it
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#818cf8" />
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={styles.screen}>
        <View style={styles.permissionContainer}>
          <View style={styles.permIconWrap}>
            <Text style={styles.permIcon}>📷</Text>
          </View>
          <Text style={styles.permTitle}>Camera Access Required</Text>
          <Text style={styles.permDesc}>
            Enable camera access in your device settings to scan QR codes for
            attendance check-in.
          </Text>
          {permission.canAskAgain ? (
            <TouchableOpacity
              style={styles.permButton}
              onPress={() => void requestPermission()}
              activeOpacity={0.85}
            >
              <Text style={styles.permButtonLabel}>Allow Camera</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.permButton}
              onPress={() => void Linking.openSettings()}
              activeOpacity={0.85}
            >
              <Text style={styles.permButtonLabel}>Open Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadAttendance();
            }}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#f8fafc" size={22} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Attendance</Text>
            <Text style={styles.subtitle}>Scan QR to check in</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <AppCard style={styles.statCard}>
            <Text style={styles.statLabel}>This Month</Text>
            <Text style={styles.statValue}>{thisMonthCount}</Text>
          </AppCard>
          <AppCard style={styles.statCard}>
            <Text style={styles.statLabel}>Total Visits</Text>
            <Text style={styles.statValue}>{records.length}</Text>
          </AppCard>
        </View>

        {/* QR Scanner */}
        <Text style={styles.sectionTitle}>Scan QR Code</Text>
        <View style={styles.scannerWrapper}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={
              scanStatus === "idle" ? handleBarcodeScanned : undefined
            }
          />

          {/* Corner markers */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Status overlays */}
          {scanStatus === "processing" && (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.overlayText}>Checking in...</Text>
            </View>
          )}

          {scanStatus === "success" && (
            <View style={[styles.overlay, styles.overlayGreen]}>
              <Text style={styles.overlayEmoji}>✓</Text>
              <Text style={styles.overlayTitle}>Attendance Marked!</Text>
              <Text style={styles.overlayText}>Check-in recorded successfully</Text>
            </View>
          )}

          {scanStatus === "already" && (
            <View style={[styles.overlay, styles.overlayBlue]}>
              <Text style={styles.overlayEmoji}>ℹ</Text>
              <Text style={styles.overlayTitle}>Already Checked In</Text>
              <Text style={styles.overlayText}>
                {alreadyMessage || "You are already checked in today"}
              </Text>
            </View>
          )}

          {scanStatus === "error" && (
            <View style={[styles.overlay, styles.overlayRed]}>
              <Text style={styles.overlayEmoji}>✕</Text>
              <Text style={styles.overlayTitle}>Scan Failed</Text>
              <Text style={styles.overlayText}>
                {errorMessage || "Unable to process QR code"}
              </Text>
              <Text style={styles.overlayHint}>Resetting in 3s...</Text>
            </View>
          )}
        </View>

        <Text style={styles.scanHint}>
          Point your camera at the gym QR code
        </Text>

        {/* History */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>
          Recent Check-ins
        </Text>
        <View style={{ gap: 12 }}>
          {records.length > 0 ? (
            records.slice(0, 20).map((item) => (
              <AppCard key={item.id}>
                <View style={styles.recordRow}>
                  <View style={styles.recordIcon}>
                    <CalendarCheck color="#34d399" size={22} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recordTitle}>{formatDate(item.date)}</Text>
                    <Text style={styles.recordSub}>
                      Checked in at {formatTime(item.checkInAt)}
                    </Text>
                  </View>
                  <Text style={styles.presentBadge}>Present</Text>
                </View>
              </AppCard>
            ))
          ) : (
            <AppCard>
              <Text style={styles.emptyText}>No attendance records yet.</Text>
            </AppCard>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;
const CORNER_COLOR = "#818cf8";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020617",
  },
  content: {
    padding: 20,
    paddingTop: 64,
    paddingBottom: 40,
  },
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
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
  },
  statLabel: {
    color: "#94a3b8",
    fontWeight: "700",
  },
  statValue: {
    color: "#f8fafc",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 8,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },
  scannerWrapper: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#0f172a",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 16,
    left: 16,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 16,
    right: 16,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 16,
    left: 16,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 16,
    right: 16,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR,
    borderBottomRightRadius: 6,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,6,23,0.88)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
  },
  overlayGreen: {
    backgroundColor: "rgba(5,46,22,0.9)",
  },
  overlayBlue: {
    backgroundColor: "rgba(3,27,78,0.9)",
  },
  overlayRed: {
    backgroundColor: "rgba(69,10,10,0.9)",
  },
  overlayEmoji: {
    fontSize: 48,
    color: "#fff",
    fontWeight: "900",
  },
  overlayTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  overlayText: {
    color: "#cbd5e1",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  overlayHint: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 4,
  },
  scanHint: {
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
  },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  recordIcon: {
    height: 46,
    width: 46,
    borderRadius: 18,
    backgroundColor: "rgba(52,211,153,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  recordTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    fontSize: 15,
  },
  recordSub: {
    color: "#94a3b8",
    marginTop: 4,
  },
  presentBadge: {
    color: "#34d399",
    fontSize: 12,
    fontWeight: "900",
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
  },
  // Permission screen
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  permIconWrap: {
    height: 80,
    width: 80,
    borderRadius: 40,
    backgroundColor: "rgba(79,70,229,0.15)",
    borderWidth: 1,
    borderColor: "rgba(79,70,229,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  permIcon: {
    fontSize: 38,
  },
  permTitle: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  permDesc: {
    color: "#94a3b8",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 23,
  },
  permButton: {
    marginTop: 8,
    height: 54,
    paddingHorizontal: 40,
    borderRadius: 18,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
  permButtonLabel: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
});
