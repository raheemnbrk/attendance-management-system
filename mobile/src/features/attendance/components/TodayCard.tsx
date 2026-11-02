import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/shared/components/ui/Card";
import { formatTime12, formatWorkedMinutes } from "@/shared/lib/date";
import { fontSize, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

export type TodayCardProps = {
  checkIn: string | null;
  checkOut: string | null;
  /** Worked minutes shown once known (live while working, final else). */
  workedMinutes: number | null;
};

export function TodayCard({ checkIn, checkOut, workedMinutes }: TodayCardProps) {
  const { colors } = useTheme();

  const checkOutText = checkOut ? formatTime12(checkOut) : "—";

  return (
    <Card>
      <Text style={[styles.heading, { color: colors.foreground }]}>Today</Text>
      <View style={styles.columns}>
        <View style={styles.column}>
          <View style={styles.badgeRow}>
            <View style={[styles.dot, { backgroundColor: checkIn ? colors.success : colors.border }]} />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Check in</Text>
          </View>
          <Text style={[styles.value, { color: colors.foreground }]}>{formatTime12(checkIn)}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.column}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.dot,
                { backgroundColor: checkOut ? colors.info : colors.border },
              ]}
            />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Check out</Text>
          </View>
          <Text style={[styles.value, { color: checkOut ? colors.foreground : colors.mutedForeground }]}>
            {checkOutText}
          </Text>
        </View>
      </View>

      <View style={[styles.workedRow, { backgroundColor: colors.muted }]}>
        <Ionicons name="time-outline" size={18} color={colors.primary} />
        <Text style={[styles.workedLabel, { color: colors.mutedForeground }]}>Worked</Text>
        <Text style={[styles.workedValue, { color: colors.foreground }]}>
          {formatWorkedMinutes(workedMinutes)}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  columns: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
  },
  column: {
    flex: 1,
    gap: spacing.xs,
  },
  badgeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs + 2,
  },
  dot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  ground: {
    height: 10,
    width: 10,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  value: {
    fontSize: fontSize.lg,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  divider: {
    height: "100%",
    minHeight: 44,
    width: StyleSheet.hairlineWidth,
  },
  workedRow: {
    alignItems: "center",
    borderRadius: spacing.sm + 2,
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  workedLabel: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  workedValue: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: "800",
    textAlign: "right",
  },
});
