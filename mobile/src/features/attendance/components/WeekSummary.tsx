import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/shared/components/ui/Card";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { formatWorkedMinutes } from "@/shared/lib/date";
import { fontSize, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";

export type WeekSummaryProps = {
  daysPresent: number | null;
  totalMinutes: number | null;
  loading?: boolean;
};

export function WeekSummary({ daysPresent, totalMinutes, loading = false }: WeekSummaryProps) {
  const { colors } = useTheme();

  return (
    <Card
      style={styles.card}
      accessibilityLabel={
        loading
          ? "Weekly summary loading"
          : `This week: ${daysPresent ?? 0} days present, ${formatWorkedMinutes(totalMinutes ?? 0)} total`
      }
    >
      <Text style={[styles.heading, { color: colors.foreground }]}>Weekly summary</Text>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Days present</Text>
          {loading ? (
            <Skeleton width={40} height={20} />
          ) : (
            <Text style={[styles.statValue, { color: colors.foreground }]}>{daysPresent ?? 0}</Text>
          )}
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total hours</Text>
          {loading ? (
            <Skeleton width={64} height={20} />
          ) : (
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {formatWorkedMinutes(totalMinutes ?? 0)}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
  },
  heading: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  stats: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: spacing.lg,
  },
  stat: {
    alignItems: "flex-start",
    flex: 1,
    gap: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: "800",
  },
  divider: {
    width: StyleSheet.hairlineWidth,
  },
});
