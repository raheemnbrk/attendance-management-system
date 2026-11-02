import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { TodayState } from "@/features/attendance/types";
import { fontSize, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

export type CheckButtonProps = {
  state: TodayState;
  working?: boolean;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
};

const confirmTitle = "Check out";
const confirmMessage = "Do you want to end your work session and check out now?";

export function CheckButton({ state, working = false, onCheckIn, onCheckOut }: CheckButtonProps) {
  const { colors } = useTheme();

  if (state === "done") {
    return (
      <View
        accessibilityLabel="You are done for today"
        style={[styles.done, { backgroundColor: colors.successSoft }]}
      >
        <Ionicons name="checkmark" size={20} color={colors.success} />
        <Text style={[styles.title, { color: colors.success }]}>You're done for today</Text>
      </View>
    );
  }

  const isCheckingOut = state === "working";

  const handlePress = () => {
    if (working) return;
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
      accessibilityLabel={isCheckingOut ? "Check out" : "Check in"}
      accessibilityState={{ busy: working, disabled: working }}
      onPress={handlePress}
      disabled={working}
      style={({ pressed }) => [
        styles.button,
        pressed && { opacity: 0.85 },
        {
          backgroundColor: isCheckingOut ? "transparent" : colors.primary,
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
            name={isCheckingOut ? "log-out-outline" : "finger-print-outline"}
            size={20}
            color={isCheckingOut ? colors.destructive : colors.primaryForeground}
          />
          <Text
            style={[
              styles.title,
              { color: isCheckingOut ? colors.destructive : colors.primaryForeground },
            ]}
          >
            {isCheckingOut ? "Check out" : "Check in"}
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
