import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from "react-native";
import { toFriendlyMessage } from "@/shared/api/errors";
import { Alert as AlertBox } from "@/shared/components/ui/Alert";
import { Badge } from "@/shared/components/ui/Badge";
import { Card } from "@/shared/components/ui/Card";
import { Skeleton, SkeletonText } from "@/shared/components/ui/Skeleton";
import { Header } from "@/shared/components/layout/Header";
import { Screen } from "@/shared/components/layout/Screen";
import { useTabBarHeight } from "@/shared/components/navigation/use-tab-bar-height";
import { useDelayedFlag } from "@/shared/hooks/use-delayed-flag";
import {
  addMonths,
  calendarWeeks,
  formatListDay,
  formatMonthTitle,
  formatTime12,
  formatWorkedMinutes,
  localIso,
  monthKey,
  weekdayHeaders,
} from "@/shared/lib/date";
import { fontSize, hitSlop, radius, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";
import { CalendarMonth } from "./CalendarMonth";
import { DayCard, deriveDayStatus, statusBadge } from "./DayCard";
import { MonthSummary } from "./MonthSummary";
import {
  useHistoryInfiniteQuery,
  useMonthRecordsQuery,
  useMonthSummaryQuery,
} from "@/features/attendance/hooks";
import type { AttendanceRecord } from "@/features/attendance/types";

type ViewMode = "list" | "calendar";

export function HistoryScreen() {
  const { colors } = useTheme();
  const tabBarPadding = useTabBarHeight();
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [mode, setMode] = useState<ViewMode>("list");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const history = useHistoryInfiniteQuery(monthDate);
  const summary = useMonthSummaryQuery(monthDate);
  const monthRecords = useMonthRecordsQuery(monthDate);

  // Skeletons only appear once loading has actually lasted a while, so quick
  // responses and cached months never flash placeholders.
  const showListSkeleton = useDelayedFlag(history.isLoading);
  const showCalendarSkeleton = useDelayedFlag(monthRecords.isLoading);

  const items = useMemo(
    () => history.data?.pages.flatMap((page) => page.items) ?? [],
    [history.data],
  );

  const recordsByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const record of monthRecords.data?.items ?? []) {
      map.set(record.date, record);
    }
    return map;
  }, [monthRecords.data]);

  const selectedRecord = selectedDay
    ? recordsByDate.get(localIso(selectedDay)) ?? null
    : null;

  const currentMonth = monthKey(new Date());
  const canGoForward =
    monthKey(monthDate) !== currentMonth &&
    monthKey(addMonths(monthDate, 1)) <= currentMonth;

  const changeMonth = (direction: -1 | 1) => {
    setSelectedDay(null);
    setMonthDate(addMonths(monthDate, direction));
  };

  const loadMore = () => {
    if (history.hasNextPage && !history.isFetchingNextPage) {
      void history.fetchNextPage();
    }
  };

  const refreshing =
    history.isRefetching || summary.isRefetching || monthRecords.isRefetching;
  const refresh = () => {
    void history.refetch();
    void summary.refetch();
    void monthRecords.refetch();
  };

  const monthSelector = (
    <View style={styles.monthSelector}>
      <MonthArrow
        direction="back"
        disabled={history.isFetching}
        color={colors.mutedForeground}
        onPress={() => changeMonth(-1)}
      />
      <Text style={[styles.monthTitle, { color: colors.foreground }]}>
        {formatMonthTitle(monthDate)}
      </Text>
      <MonthArrow
        direction="forward"
        disabled={!canGoForward || history.isFetching}
        color={colors.mutedForeground}
        onPress={() => changeMonth(1)}
      />
    </View>
  );

  const modeToggle = (
    <View
      style={[styles.toggle, { backgroundColor: colors.muted }]}
      accessibilityRole="tablist"
      accessibilityLabel="Attendance view toggle"
    >
      {(["list", "calendar"] as const).map((option) => {
        const active = mode === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${option === "list" ? "List" : "Calendar"} view`}
            onPress={() => setMode(option)}
            hitSlop={hitSlop}
            style={[styles.toggleItem, active && { backgroundColor: colors.primary }]}
          >
            <Text
              style={[
                styles.toggleLabel,
                { color: active ? colors.primaryForeground : colors.mutedForeground },
              ]}
            >
              {option === "list" ? "List" : "Calendar"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const summaryBlock = summary.isError ? (
    <AlertBox
      tone="warning"
      message={toFriendlyMessage(summary.error)}
      onRetry={() => void summary.refetch()}
    />
  ) : (
    <MonthSummary summary={summary.data ?? null} loading={summary.isLoading} />
  );

  const renderItem: ListRenderItem<AttendanceRecord> = ({ item }) => <DayCard record={item} />;

  return (
    <Screen padded>
      <Header
        title="Attendance"
        right={
          <Ionicons
            name="calendar-outline"
            size={22}
            color={colors.foreground}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        }
      />

      {mode === "list" ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: tabBarPadding }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            <View style={styles.sectionStack}>
              {monthSelector}
              {modeToggle}
              {summaryBlock}
            </View>
          }
          ListEmptyComponent={
            history.isError ? (
              <View style={styles.emptyWrap}>
                <AlertBox
                  tone="error"
                  message={toFriendlyMessage(history.error)}
                  onRetry={() => void history.refetch()}
                />
              </View>
            ) : history.isLoading ? (
              showListSkeleton ? (
                <View style={styles.emptyWrap}>
                  <DayCardSkeleton />
                  <DayCardSkeleton />
                  <DayCardSkeleton />
                </View>
              ) : (
                // <300 ms of loading: keep the empty area instead of a flash.
                undefined
              )
            ) : (
              <EmptyState />
            )
          }
          ListFooterComponent={
            history.isFetchingNextPage ? (
              <View style={styles.footer}>
                <DayCardSkeleton />
              </View>
            ) : undefined
          }
        />
      ) : (
        <View style={[styles.calendarStack, { paddingBottom: tabBarPadding }]}>
          {monthSelector}
          {modeToggle}
          {summaryBlock}

          {monthRecords.isError ? (
            <AlertBox
              tone="warning"
              message={toFriendlyMessage(monthRecords.error)}
              onRetry={() => void monthRecords.refetch()}
            />
          ) : (
            <>
              <Card padding={spacing.md}>
                {showCalendarSkeleton ? (
                  <CalendarSkeleton monthDate={monthDate} />
                ) : monthRecords.isLoading ? (
                  // <300 ms of loading: keep the card empty instead of a flash.
                  null
                ) : (
                  <>
                    <CalendarMonth
                      monthDate={monthDate}
                      records={monthRecords.data?.items ?? []}
                      selectedDay={selectedDay}
                      onSelectDay={setSelectedDay}
                    />
                    {recordsByDate.size === 0 && !monthRecords.isLoading ? (
                      <View style={styles.emptyInline}>
                        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                          No attendance records this month
                        </Text>
                      </View>
                    ) : null}
                  </>
                )}
              </Card>

              {selectedDay ? (
                <SelectedDayDetail date={selectedDay} record={selectedRecord} />
              ) : null}
            </>
          )}
        </View>
      )}
    </Screen>
  );
}

function MonthArrow({
  direction,
  onPress,
  disabled,
  color,
}: {
  direction: "back" | "forward";
  onPress: () => void;
  disabled: boolean;
  color: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={direction === "back" ? "Previous month" : "Next month"}
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        styles.arrow,
        { opacity: disabled ? 0.35 : pressed ? 0.6 : 1 },
      ]}
    >
      <Ionicons
        name={direction === "back" ? "chevron-back" : "chevron-forward"}
        size={22}
        color={color}
      />
    </Pressable>
  );
}

/** Day-row placeholder mirroring DayCard: same card chrome, padding, left
 * date/times column and right worked + badge column. */
function DayCardSkeleton() {
  return (
    <Card padding={spacing.md + 2} style={daySkeletonStyles.card}>
      <View style={daySkeletonStyles.row}>
        <View style={daySkeletonStyles.info}>
          <SkeletonText width={110} height={20} />
          <SkeletonText width={128} height={16} />
        </View>
        <View style={daySkeletonStyles.right}>
          <SkeletonText width={52} height={18} />
          <Skeleton width={68} height={24} borderRadius={999} />
        </View>
      </View>
    </Card>
  );
}

/** Calendar placeholder mirroring CalendarMonth: weekday header row plus as
 * many week rows as the month actually has, day pill and status dot per cell. */
function CalendarSkeleton({ monthDate }: { monthDate: Date }) {
  const weeks = calendarWeeks(monthDate);
  return (
    <View accessibilityLabel="Loading attendance calendar">
      <View style={daySkeletonStyles.calendarHeader}>
        {weekdayHeaders().map((day, index) => (
          <View key={`${day}-${index}`} style={daySkeletonStyles.calendarCell}>
            <Skeleton width={22} height={16} />
          </View>
        ))}
      </View>
      {weeks.map((week, weekIndex) => (
        <View key={`week-${weekIndex}`} style={daySkeletonStyles.calendarWeek}>
          {week.map((day) => (
            <View key={localIso(day)} style={daySkeletonStyles.calendarCell}>
              <Skeleton width={32} height={22} borderRadius={999} />
              <View style={daySkeletonStyles.calendarDotSlot}>
                <Skeleton width={8} height={8} circle />
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function SelectedDayDetail({
  date,
  record,
}: {
  date: Date;
  record: AttendanceRecord | null;
}) {
  const { colors } = useTheme();
  const status = deriveDayStatus(date, record ?? undefined);
  const badge = statusBadge(status);

  return (
    <Card style={styles.detailCard} accessibilityLabel={`Details for ${formatListDay(date)}`}>
      <View style={styles.detailHeader}>
        <Text style={[styles.detailTitle, { color: colors.foreground }]}>
          {formatListDay(date)}
        </Text>
        {badge ? <Badge label={badge.label} tone={badge.tone} dot /> : null}
      </View>

      <DetailRow
        icon="log-in-outline"
        label="Check in"
        value={record ? formatTime12(record.checkIn) : "—"}
      />
      <DetailRow
        icon="log-out-outline"
        label="Check out"
        value={record?.checkOut ? formatTime12(record.checkOut) : "—"}
      />
      <DetailRow
        icon="time-outline"
        label="Worked"
        value={record?.checkOut ? formatWorkedMinutes(record.workedMinutes ?? null) : "—"}
      />
    </Card>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function EmptyState() {
  const { colors } = useTheme();
  return (
    <View style={styles.emptyWrap} accessibilityLabel="No attendance records">
      <Ionicons name="calendar-clear-outline" size={44} color={colors.mutedForeground} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        No attendance records
      </Text>
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
        Check in and out to start building your history.
      </Text>
    </View>
  );
}

const daySkeletonStyles = StyleSheet.create({
  card: {
    width: "100%",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  right: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  calendarHeader: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  calendarWeek: {
    flexDirection: "row",
  },
  calendarCell: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 3,
  },
  calendarDotSlot: {
    alignItems: "center",
    height: 18,
    justifyContent: "center",
    marginTop: 1,
    width: 18,
  },
});

const styles = StyleSheet.create({
  sectionStack: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  monthSelector: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  monthTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: "700",
    textAlign: "center",
  },
  arrow: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  toggle: {
    borderRadius: radius.full,
    flexDirection: "row",
    padding: 4,
  },
  toggleItem: {
    alignItems: "center",
    borderRadius: radius.full,
    flex: 1,
    height: 40,
    justifyContent: "center",
  },
  toggleLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  calendarStack: {
    flex: 1,
    gap: spacing.md,
  },
  detailCard: {
    gap: spacing.sm,
  },
  detailHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  detailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  detailLabel: {
    flex: 1,
    fontSize: fontSize.sm,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  emptyInline: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  footer: {
    paddingTop: spacing.md,
  },
  emptyWrap: {
    alignItems: "center",
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.xxl,
    width: "100%",
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
