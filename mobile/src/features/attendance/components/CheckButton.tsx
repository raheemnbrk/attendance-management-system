import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { TodayState } from "@/features/attendance/types";
import { fontSize, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

export type CheckButtonProps = {
  state: TodayState;
  working?: boolean;
  /** When set, check-in is not open (before 08:00 or on a rest day): the
   * button shows this reason and stays disabled. Check-out is never limited. */
  lockedLabel?: string;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
};

const confirmTitle = "Check out";
const confirmMessage = "Do you want to end your work session and check out now?";

export function CheckButton({ state, working = false, lockedLabel, onCheckIn, onCheckOut }: CheckButtonProps) {
  const { colors } = useTheme();

  if (state === "done") {
    return (
      <View
        accessibilityLabel="You are done for today"
        style={[styles.done, { backgroundColor: colors.successSoft }]}
      >
        <Ionicons name="checkmark" size={20} color={colors.success} />
        <Text style={[styles.title, { color: colors.success }]}>{"You're done for today"}</Text>
      </View>
    );
  }

  const isCheckingOut = state === "working";
  // Only the check-in pill can be locked; check-out has no opening rule.
  const isLocked = !isCheckingOut && Boolean(lockedLabel);

  const handlePress = () => {
    if (working || isLocked) return;
    if (isCheckingOut) {
      Alert.alert(confirmTitle, confirmMessage, [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Check out",
          style: "destructive",
          onPress: () => onCheckOut?.(),
        },
      ]);
      return;
    }
    onCheckIn?.();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isCheckingOut ? "Check out" : lockedLabel ?? "Check in"}
      accessibilityState={{ busy: working, disabled: working || isLocked }}
      onPress={handlePress}
      disabled={working || isLocked}
      style={({ pressed }) => [
        styles.button,
        pressed && { opacity: 0.85 },
        {
          backgroundColor: isCheckingOut
            ? "transparent"
            : isLocked
              ? colors.muted
              : colors.primary,
          borderColor: isCheckingOut ? colors.destructive : "transparent",
        },
      ]}
    >
      {working ? (
        <ActivityIndicator
          color={isCheckingOut ? colors.destructive : colors.primaryForeground}
          accessibilityLabel={isCheckingOut ? "Checking out" : "Checking in"}
        />
      ) : (
        <>
          <Ionicons
            name={isCheckingOut ? "log-out-outline" : isLocked ? "lock-closed-outline" : "finger-print-outline"}
            size={20}
            color={isCheckingOut ? colors.destructive : isLocked ? colors.mutedForeground : colors.primaryForeground}
          />
          <Text
            style={[
              styles.title,
              {
                color: isCheckingOut
                  ? colors.destructive
                  : isLocked
                    ? colors.mutedForeground
                    : colors.primaryForeground,
              },
            ]}
          >
            {isCheckingOut ? "Check out" : isLocked ? lockedLabel : "Check in"}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 999,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: spacing.sm,
    height: 56,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    width: "100%",
  },
  title: {
    fontSize: fontSize.md + 1,
    fontWeight: "700",
  },
  done: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: spacing.sm,
    height: 56,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    width: "100%",
  },
});
