import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { QrCode, ArrowLeft, CircleCheck } from "lucide-react-native";

import { attendanceService } from "../../src/services/attendance.service";

export default function ScannerPage() {
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

      /**
       * QR FORMAT
       * ----------
       * gym:<gymId>
       *
       * Example:
       * gym:cmparldim0000ugempycpqy5j
       */

      if (!data.startsWith("gym:")) {
        Alert.alert("Invalid QR", "This QR code is not valid.");
        setScanned(false);
        setLoading(false);
        return;
      }

      const gymId = data.replace("gym:", "");

      await attendanceService.scan(gymId);

      Alert.alert(
        "Check-in Successful",
        "Your attendance has been marked.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/member/dashboard"),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Check-in Failed",
        error?.response?.data?.message ||
          "Unable to mark attendance."
      );

      setScanned(false);
    } finally {
      setLoading(false);
    }
  }

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#818cf8" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <LinearGradient
        colors={["#020617", "#0f172a"]}
        style={styles.permissionContainer}
      >
        <QrCode color="#818cf8" size={72} />

        <Text style={styles.permissionTitle}>
          Camera Permission Required
        </Text>

        <Text style={styles.permissionText}>
          Enable camera access to scan gym QR codes.
        </Text>

        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => requestPermission()}
        >
          <Text style={styles.permissionButtonText}>
            Allow Camera
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={"back" as CameraType}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={
            scanned
                ? undefined
                : (event: { data: string }) => {
                    void handleScan(event.data);
                }
            }
      />

      <LinearGradient
        colors={["rgba(2,6,23,0.92)", "transparent", "rgba(2,6,23,0.95)"]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color="#fff" size={22} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Scan Gym QR</Text>

        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          Place the QR inside the frame
        </Text>

        <Text style={styles.subtitle}>
          Scan the gym QR code to mark attendance
        </Text>

        <View style={styles.scanFrameWrapper}>
          <View style={styles.scanFrame} />

          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#818cf8" />

            <Text style={styles.loadingText}>
              Marking attendance...
            </Text>
          </View>
        )}

        {scanned && !loading && (
          <View style={styles.successBox}>
            <CircleCheck color="#10b981" size={20} />

            <Text style={styles.successText}>
              QR scanned successfully
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const FRAME_SIZE = 260;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#020617",
  },

  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
  },

  permissionTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 24,
  },

  permissionText: {
    color: "#94a3b8",
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 24,
  },

  permissionButton: {
    marginTop: 32,
    backgroundColor: "#6366f1",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 18,
  },

  permissionButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

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

  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },

  subtitle: {
    color: "#94a3b8",
    fontSize: 15,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
  },

  scanFrameWrapper: {
    marginTop: 48,
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },

  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: 32,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  cornerTopLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 48,
    height: 48,
    borderTopWidth: 6,
    borderLeftWidth: 6,
    borderColor: "#818cf8",
    borderTopLeftRadius: 20,
  },

  cornerTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 48,
    height: 48,
    borderTopWidth: 6,
    borderRightWidth: 6,
    borderColor: "#818cf8",
    borderTopRightRadius: 20,
  },

  cornerBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 48,
    height: 48,
    borderBottomWidth: 6,
    borderLeftWidth: 6,
    borderColor: "#818cf8",
    borderBottomLeftRadius: 20,
  },

  cornerBottomRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 48,
    height: 48,
    borderBottomWidth: 6,
    borderRightWidth: 6,
    borderColor: "#818cf8",
    borderBottomRightRadius: 20,
  },

  loadingBox: {
    marginTop: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(15,23,42,0.88)",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
  },

  loadingText: {
    color: "#fff",
    fontWeight: "700",
  },

  successBox: {
    marginTop: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(16,185,129,0.12)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
  },

  successText: {
    color: "#10b981",
    fontWeight: "700",
  },
});