import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { useIsFocused, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCheckIn, useCheckOut } from "@/features/attendance/hooks";
import { ApiError, toFriendlyMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/Button";
import { formatTime12 } from "@/shared/lib/date";
import { fontSize, hitSlop, radius, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

type ScanMode = "check-in" | "check-out";

type ScanPhase =
  | { status: "scanning" }
  | { status: "validating" }
  | { status: "failed"; message: string; soft?: boolean }
  | { status: "success"; stamp: string };

const SUCCESS_RETURN_DELAY_MS = 1800;

/** Attendance QR codes carry a short-lived JWT issued by the backend. Anything
 * not shaped like a JWT (three dot-separated base64url parts) is rejected
 * before the API is called at all. */
const JWT_LIKE_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const FRAME_MAX = 260;
const CORNER = 28;
const CONSOLE_STROKE = 3;

export default function ScanRoute() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: ScanMode = params.mode === "check-out" ? "check-out" : "check-in";
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const scannedRef = useRef(false);
  const [phase, setPhase] = useState<ScanPhase>({ status: "scanning" });

  const title = mode === "check-out" ? "Scan QR to check out" : "Scan QR to check in";
  const verb = mode === "check-out" ? "check out" : "check in";
  const cameraOn = Boolean(permission?.granted) && isFocused && phase.status !== "success";

  useEffect(() => {
    if (phase.status !== "success") return undefined;
    const timer = setTimeout(() => router.back(), SUCCESS_RETURN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase, router]);

  const handleScan = (event: BarcodeScanningResult) => {
    if (scannedRef.current) return;
    scannedRef.current = true;

    const token = event.data.trim();
    if (!JWT_LIKE_PATTERN.test(token)) {
      // Stay in "scanning" styling-wise: show the reason without a round-trip
      // to the server.
      setPhase({ status: "failed", message: "This is not an attendance QR code.", soft: false });
      return;
    }

    setPhase({ status: "validating" });
    const submit = mode === "check-out" ? checkOut : checkIn;
    submit.mutate(token, {
      onSuccess: (record) => {
        const stampRaw = mode === "check-in" ? record.checkIn : record.checkOut ?? record.checkIn;
        const stampMs = Date.parse(stampRaw);
        const stampText = Number.isNaN(stampMs)
          ? formatTime12(new Date())
          : formatTime12(new Date(stampMs));
        setPhase({ status: "success", stamp: stampText });
      },
      onError: (error) => {
        // Expected business rules (opening time, rest day) get a soft amber
        // notice; everything else stays red.
        const soft = error instanceof ApiError && (error.code === "TOO_EARLY" || error.code === "REST_DAY");
        setPhase({ status: "failed", message: toFriendlyMessage(error), soft });
      },
    });
  };

  const resetScan = () => {
    scannedRef.current = false;
    setPhase({ status: "scanning" });
  };

  if (!permission) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.centerCover}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={[styles.centerCover, styles.permissionContent]}>
          <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="camera-outline" size={30} color={colors.primary} />
          </View>
          <Text style={[styles.centerTitle, { color: colors.foreground }]}>Camera access needed</Text>
          <Text style={[styles.centerText, { color: colors.mutedForeground }]}>
            To scan the attendance QR code, Punchin needs to use your camera. You can change this anytime in device settings.
          </Text>
          {permission.canAskAgain ? (
            <Button
              title="Allow camera"
              icon={<Ionicons name="camera" size={18} color={colors.primaryForeground} />}
              onPress={() => {
                void requestPermission();
              }}
            />
          ) : (
            <Button
              title="Open settings"
              icon={<Ionicons name="settings-outline" size={18} color={colors.primaryForeground} />}
              onPress={() => {
                void Linking.openSettings();
              }}
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={cameraOn ? "light" : isDark ? "light" : "dark"} />
      {cameraOn ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={phase.status === "scanning" ? handleScan : undefined}
        />
      ) : null}

      {cameraOn ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} />
      ) : null}

      {phase.status !== "success" ? (
        <View style={[styles.topRow, { paddingTop: insets.top + spacing.md }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel scan"
            hitSlop={hitSlop}
            onPress={() => router.back()}
            style={[styles.closeButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="close" size={22} color={colors.primaryForeground} />
          </Pressable>
          <Text style={[styles.topTitle, { color: colors.primaryForeground }]}>{title}</Text>
        </View>
      ) : null}

      <View style={styles.centerCover}>
        {phase.status === "scanning" ? (
          <>
            <View style={styles.frame}>
              <View style={[styles.corner, styles.cornerTL, { borderLeftColor: colors.primary, borderTopColor: colors.primary }]} />
              <View style={[styles.corner, styles.cornerTR, { borderRightColor: colors.primary, borderTopColor: colors.primary }]} />
              <View style={[styles.corner, styles.cornerBL, { borderLeftColor: colors.primary, borderBottomColor: colors.primary }]} />
              <View style={[styles.corner, styles.cornerBR, { borderRightColor: colors.primary, borderBottomColor: colors.primary }]} />
            </View>
            <View style={[styles.caption, { backgroundColor: colors.primary }]}>
              <Ionicons name="scan-outline" size={18} color={colors.primaryForeground} />
              <Text style={[styles.captionText, { color: colors.primaryForeground }]}>
                Point the camera at the attendance QR code
              </Text>
            </View>
          </>
        ) : null}

        {phase.status === "validating" ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {mode === "check-out" ? "Checking out…" : "Checking in…"}
            </Text>
          </View>
        ) : null}

        {phase.status === "failed" ? (
          <View
            style={[styles.card, styles.cardWide, { backgroundColor: colors.card, borderColor: colors.border }]}
            accessibilityLabel={`Cannot ${verb}`}
          >
            <View
              style={[
                styles.badge,
                styles.cardBadge,
                { backgroundColor: phase.soft ? colors.warningSoft : colors.destructiveSoft },
              ]}
            >
              <Ionicons
                name={phase.soft ? "time-outline" : "alert-circle"}
                size={30}
                color={phase.soft ? colors.warning : colors.destructive}
              />
            </View>
            <Text style={[styles.cardTitle, { color: phase.soft ? colors.warning : colors.destructive }]}>
              Cannot {verb}
            </Text>
            <Text style={[styles.cardText, { color: colors.mutedForeground }]}>{phase.message}</Text>
            <Button title="Scan again" variant="outline" onPress={resetScan} />
          </View>
        ) : null}

        {phase.status === "success" ? (
          <View style={[styles.card, styles.cardWide, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.badge, styles.cardBadge, { backgroundColor: colors.successSoft }]}>
              <Ionicons name="checkmark" size={30} color={colors.success} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.success }]}>
              {"You're "}{mode === "check-out" ? "checked out" : "checked in"}
            </Text>
            <Text style={[styles.cardTime, { color: colors.foreground }]}>{phase.stamp}</Text>
            <Text style={[styles.cardText, { color: colors.mutedForeground }]}>Returning to Today…</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centerCover: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  permissionContent: {
    padding: spacing.xxl,
  },
  badge: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  centerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: "800",
    marginTop: spacing.lg,
    textAlign: "center",
  },
  centerText: {
    fontSize: fontSize.md,
    lineHeight: fontSize.md + 6,
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    left: 0,
    paddingHorizontal: spacing.xl,
    position: "absolute",
    right: 0,
  },
  closeButton: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  topTitle: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  frame: {
    height: FRAME_MAX,
    width: FRAME_MAX,
  },
  corner: {
    height: CORNER,
    position: "absolute",
    width: CORNER,
    borderWidth: CONSOLE_STROKE,
  },
  cornerTL: {
    borderBottomWidth: 0,
    borderRightWidth: 0,
    left: 0,
    top: 0,
  },
  cornerTR: {
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    right: 0,
    top: 0,
  },
  cornerBL: {
    borderRightWidth: 0,
    borderTopWidth: 0,
    bottom: 0,
    left: 0,
  },
  cornerBR: {
    borderLeftWidth: 0,
    borderTopWidth: 0,
    bottom: 0,
    right: 0,
  },
  caption: {
    alignItems: "center",
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  captionText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  card: {
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  cardWide: {
    marginHorizontal: spacing.xl,
    width: FRAME_MAX + spacing.xl * 2,
  },
  cardBadge: {
    height: 56,
    width: 56,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    textAlign: "center",
  },
  cardText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm + 5,
    textAlign: "center",
  },
  cardTime: {
    fontSize: fontSize.xxxl,
    fontWeight: "800",
  },
});
