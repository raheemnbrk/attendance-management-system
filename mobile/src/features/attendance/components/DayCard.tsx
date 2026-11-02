import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Badge, type BadgeTone } from "@/shared/components/ui/Badge";
import { Card } from "@/shared/components/ui/Card";
import {
  formatListDay,
  formatTime12,
  formatWorkedMinutes,
} from "@/shared/lib/date";
import { fontSize, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";
import type { AttendanceRecord } from "@/features/attendance/types";

export type DayStatus = "present" | "forgotten" | "absent" | "weekend" | null;

/** Color/status rules shared by the list rows and the calendar dots. */
export function deriveDayStatus(
  date: Date,
  record: AttendanceRecord | undefined,
): DayStatus {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isWeekend = dayStart.getDay() === 0 || dayStart.getDay() === 6;

  if (record) {
    if (record.checkOut) {
      return "present";
    }
    // Still working today is present; a past day without check-out was
    // forgotten.
    if (dayStart < todayStart) {
      return "forgotten";
    }
    return "present";
  }

  if (isWeekend) {
    return "weekend";
  }
  if (dayStart < todayStart) {
    return "absent";
  }
  return null;
}

export function statusBadge(status: DayStatus): { label: string; tone: BadgeTone } | null {
  switch (status) {
    case "present":
      return { label: "Present", tone: "success" };
    case "forgotten":
      return { label: "Forgot", tone: "warning" };
    case "absent":
      return { label: "Absent", tone: "destructive" };
    case "weekend":
      return { label: "Weekend", tone: "muted" };
    default:
      return null;
  }
}

export type DayCardProps = {
  record: AttendanceRecord;
};

export function DayCard({ record }: DayCardProps) {
  const { colors } = useTheme();
  const date = new Date(`${record.date}T00:00:00`);
  const status = deriveDayStatus(date, record);
  const badge = statusBadge(status);
  const worked = formatWorkedMinutes(record.workedMinutes ?? null);

  return (
    <Card
      padding={spacing.md + 2}
      style={styles.row}
      accessibilityLabel={`${formatListDay(date)}, check in ${formatTime12(record.checkIn)}, check out ${formatTime12(record.checkOut)}, worked ${worked}${badge ? `, ${badge.label}` : ""}`}
    >
      <View style={styles.info}>
        <Text style={[styles.date, { color: colors.foreground }]}>{formatListDay(date)}</Text>
        <View style={styles.times}>
          <Ionicons name="log-in-outline" size={14} color={colors.mutedForeground} />
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {formatTime12(record.checkIn)}
          </Text>
          <Ionicons name="log-out-outline" size={14} color={colors.mutedForeground} />
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {formatTime12(record.checkOut)}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.worked, { color: colors.foreground }]}>{worked}</Text>
        {badge ? <Badge label={badge.label} tone={badge.tone} dot /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  date: {
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  times: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  time: {
    fontSize: fontSize.xs,
    fontVariant: ["tabular-nums"],
  },
  right: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  worked: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
