import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Alert as AlertBox } from "@/shared/components/ui/Alert";
import { Badge } from "@/shared/components/ui/Badge";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { toFriendlyMessage } from "@/shared/api/errors";
import { formatWorkedMinutes } from "@/shared/lib/date";
import { fontSize, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";
import type { MonthSummary } from "@/features/attendance/types";

export type MonthSummaryProps = {
  summary: MonthSummary | null;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
};

type StatTone = "primary" | "success" | "info" | "warning";

const statConfig: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  tone: StatTone;
  label: string;
}> = [
  { icon: "calendar-outline", tone: "primary", label: "Days present" },
  { icon: "time-outline", tone: "success", label: "Total hours" },
  { icon: "trending-up-outline", tone: "info", label: "Avg per day" },
  { icon: "alert-circle-outline", tone: "warning", label: "Forgot check-outs" },
];

export function MonthSummary({ summary, loading = false, error, onRetry }: MonthSummaryProps) {
  const { colors } = useTheme();

  if (error) {
    return (
      <AlertBox
        tone="warning"
        message={toFriendlyMessage(error)}
        onRetry={onRetry}
      />
    );
  }

  const values = summary
    ? [
        String(summary.daysPresent),
        formatWorkedMinutes(summary.totalMinutes),
        formatWorkedMinutes(summary.averageMinutesPerDay),
        String(summary.forgottenCheckOuts),
      ]
    : null;

  return (
    <View style={styles.grid}>
      {statConfig.map((config, index) => {
        const background =
          config.tone === "primary"
            ? colors.primarySoft
            : config.tone === "success"
              ? colors.successSoft
              : config.tone === "info"
                ? colors.infoSoft
                : colors.warningSoft;
        const foreground =
          config.tone === "primary"
            ? colors.primary
            : config.tone === "success"
              ? colors.success
              : config.tone === "info"
                ? colors.info
                : colors.warning;

        return (
          <View
            key={config.label}
            style={[styles.tile, { backgroundColor: background }]}
            accessibilityLabel={`${config.label}: ${values ? values[index] : "loading"}`}
          >
            <Ionicons name={config.icon} size={18} color={foreground} />
            {loading || values === null ? (
              <Skeleton width={72} height={22} />
            ) : (
              <Text style={[styles.value, { color: foreground }]}>{values[index]}</Text>
            )}
            <Text style={[styles.label, { color: foreground }]}>{config.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tile: {
    alignItems: "flex-start",
    borderRadius: spacing.lg,
    flexBasis: "31%",
    gap: spacing.xs,
    flexGrow: 1,
    padding: spacing.md + 2,
  },
  value: {
    fontSize: fontSize.xl,
    fontWeight: "800",
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
});
