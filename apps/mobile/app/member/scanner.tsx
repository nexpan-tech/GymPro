import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { QrCode, ArrowLeft, CircleCheck } from "lucide-react-native";

import { attendanceService } from "../../src/services/attendance.service";
import { useTheme } from "../../src/theme";
import { AppButton, AppScreen, AppText } from "../../src/components/ui";

export default function ScannerPage() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permission) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  async function handleScan(data: string) {
    if (scanned || loading) return;

    try {
      setScanned(true);
      setLoading(true);

      // QR FORMAT: gym:<gymId>
      if (!data.startsWith("gym:")) {
        Alert.alert("Invalid QR", "This QR code is not valid.");
        setScanned(false);
        setLoading(false);
        return;
      }

      const gymId = data.replace("gym:", "");
      await attendanceService.scan(gymId);

      Alert.alert("Check-in Successful", "Your attendance has been marked.", [
        { text: "OK", onPress: () => router.replace("/member/dashboard") },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Check-in Failed",
        error?.response?.data?.message || "Unable to mark attendance.",
      );
      setScanned(false);
    } finally {
      setLoading(false);
    }
  }

  if (!permission) {
    return (
      <View style={[styles.centered, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} />
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
          Enable camera access to scan gym QR codes.
        </AppText>
        <AppButton onPress={() => void requestPermission()} style={{ marginTop: 8 }}>
          Allow Camera
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
        colors={["rgba(2,6,23,0.92)", "transparent", "rgba(2,6,23,0.95)"]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#fff" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Gym QR</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Place the QR inside the frame</Text>
        <Text style={styles.subtitle}>Scan the gym QR code to mark attendance</Text>

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
        {scanned && !loading && (
          <View style={styles.statusBox}>
            <CircleCheck color="#10b981" size={20} />
            <Text style={styles.statusText}>QR scanned successfully</Text>
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
  container: { flex: 1, backgroundColor: "#020617" },
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
    backgroundColor: "rgba(15,23,42,0.65)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  content: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  title: { color: "#fff", fontSize: 26, fontWeight: "800", textAlign: "center" },
  subtitle: { color: "#94a3b8", fontSize: 15, textAlign: "center", marginTop: 12, lineHeight: 22 },
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
    backgroundColor: "rgba(15,23,42,0.8)",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  statusText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
