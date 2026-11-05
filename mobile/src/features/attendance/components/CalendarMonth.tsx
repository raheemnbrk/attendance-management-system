import { StyleSheet, Text, View } from "react-native";
import {
  calendarWeeks,
  formatDayNumber,
  formatListDay,
  isSameDayLocal,
  isSameMonthLocal,
  localIso,
  weekdayHeaders,
} from "@/shared/lib/date";
import { fontSize, radius, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";
import type { AttendanceRecord } from "@/features/attendance/types";
import { deriveDayStatus, type DayStatus } from "./DayCard";

export type CalendarMonthProps = {
  monthDate: Date;
  records: AttendanceRecord[];
  selectedDay: Date | null;
  onSelectDay: (day: Date) => void;
};

function dotColor(status: DayStatus, colors: ReturnType<typeof useTheme>["colors"]): string | null {
  switch (status) {
    case "present":
      return colors.success;
    case "forgotten":
      return colors.warning;
    case "absent":
      return colors.destructive;
    case "rest":
      return colors.mutedForeground;
    default:
      return null;
  }
}

export function CalendarMonth({ monthDate, records, selectedDay, onSelectDay }: CalendarMonthProps) {
  const { colors } = useTheme();

  const recordByKey = new Map<string, AttendanceRecord>();
  for (const record of records) {
    recordByKey.set(record.date, record);
  }
  const today = new Date();
  const weeks = calendarWeeks(monthDate);

  return (
    <View accessible accessibilityLabel="Attendance calendar">
      <View style={styles.headers}>
        {weekdayHeaders().map((day, index) => (
          <Text key={`${day}-${index}`} style={[styles.headerLabel, { color: colors.mutedForeground }]}>
            {day}
          </Text>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.week}>
          {week.map((day) => {
            const inMonth = isSameMonthLocal(day, monthDate);
            const key = localIso(day);
            const record = recordByKey.get(key);
            const status = deriveDayStatus(day, record);
            const dot = inMonth ? dotColor(status, colors) : null;
            const isToday = isSameDayLocal(day, today);
            const isSelected = selectedDay ? isSameDayLocal(day, selectedDay) : false;

            return (
              <View key={key} style={styles.cell}>
                <Text
                  onPress={() => onSelectDay(day)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${formatListDay(day)}`}
                  style={[
                    styles.dayNumber,
                    { color: inMonth ? colors.foreground : colors.mutedForeground },
                    isToday && !isSelected && { color: colors.primary, fontWeight: "800" },
                    isSelected && {
                      backgroundColor: colors.primary,
                      color: colors.primaryForeground,
                      fontWeight: "800",
                    },
                  ]}
                >
                  {formatDayNumber(day)}
                </Text>
                <View
                  style={[
                    styles.dotSlot,
                    isToday && !isSelected && { backgroundColor: colors.primarySoft },
                  ]}
                >
                  {dot && inMonth ? (
                    <View style={[styles.dot, { backgroundColor: dot }]} />
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headers: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  headerLabel: {
    flex: 1,
    fontSize: fontSize.xs,
    fontWeight: "600",
    textAlign: "center",
  },
  week: {
    flexDirection: "row",
  },
  cell: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 3,
  },
  dayNumber: {
    alignItems: "center",
    borderRadius: radius.full,
    fontSize: fontSize.sm,
    fontWeight: "600",
    paddingBottom: 2,
    paddingTop: 2,
    textAlign: "center",
    width: 32,
  },
  dotSlot: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 18,
    justifyContent: "center",
    marginTop: 1,
    width: 18,
  },
  dot: {
    borderRadius: radius.full,
    height: 8,
    width: 8,
  },
});
