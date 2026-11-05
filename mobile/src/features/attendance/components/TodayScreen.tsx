import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { toFriendlyMessage } from "@/shared/api/errors";
import { Alert as AlertBox } from "@/shared/components/ui/Alert";
import { Card } from "@/shared/components/ui/Card";
import { Skeleton, SkeletonCircle, SkeletonText } from "@/shared/components/ui/Skeleton";
import { Header } from "@/shared/components/layout/Header";
import { Screen } from "@/shared/components/layout/Screen";
import { useTabBarHeight } from "@/shared/components/navigation/use-tab-bar-height";
import { formatElapsedClock, formatHeaderDate, formatTime12, formatWorkedMinutes } from "@/shared/lib/date";
import { checkInLockReason, isRestDayAt, REST_DAY_NOTICE } from "@/shared/lib/business";
import { fontSize, radius, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";
import { useDelayedFlag } from "@/shared/hooks/use-delayed-flag";
import { useTick } from "@/shared/hooks/use-tick";
import type { AppUser } from "@/shared/types";
import { CheckButton } from "./CheckButton";
import { TimerRing } from "./TimerRing";
import { TodayCard } from "./TodayCard";
import { WeekSummary } from "./WeekSummary";
import { useTodayQuery, useWeekSummaryQuery } from "@/features/attendance/hooks";
import type { TodayState } from "@/features/attendance/types";

/** A typical workday drives the ring fill while the timer runs. */
const EXPECTED_WORK_MS = 8 * 60 * 60 * 1000;

export type TodayScreenProps = {
  user: AppUser | null;
};

function initials(name: string | null): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "—";
  const parts = trimmed.split(/\s+/);
  const letters = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase());
  return letters.join("") || "?";
}

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function TodayScreen({ user }: TodayScreenProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const tabBarPadding = useTabBarHeight();
  const today = useTodayQuery();
  const week = useWeekSummaryQuery();

  // Skeleton only appears once loading has actually lasted a while, so quick
  // responses never flash placeholders.
  const showSkeleton = useDelayedFlag(today.isLoading);

  const now = useTick(today.data?.record?.checkOut ? 30_000 : 1_000);

  const offsetMs = today.data?.serverOffsetMs ?? 0;
  const correctedNow = now + offsetMs;
  const record = today.data?.record ?? null;
  const state: TodayState =
    !record || today.isLoading ? (record ? "working" : "idle") : record.checkOut ? "done" : "working";

  // Time rules are mirrored client-side on the server-corrected clock so the
  // button pre-empts what the API would reject. The backend stays the source
  // of truth (it answers TOO_EARLY / REST_DAY with its own messages).
  const isRestToday = isRestDayAt(correctedNow);
  const checkInLockedLabel = state === "idle" ? checkInLockReason(correctedNow) : null;
  const showRestDayNotice = state === "idle" && isRestToday;

  const firstName = (user?.name ?? "").trim().split(/\s+/)[0] ?? "";

  let ringLabel = formatTime12(new Date(correctedNow));
  let ringCaption = "Not checked in";
  let progress = 0;

  if (state === "working" && record) {
    const elapsed = Math.max(0, correctedNow - Date.parse(record.checkIn));
    ringLabel = formatElapsedClock(elapsed);
    ringCaption = "Working";
    progress = Math.min(1, elapsed / EXPECTED_WORK_MS);
  } else if (state === "done" && record) {
    ringLabel = formatWorkedMinutes(record.workedMinutes ?? null);
    ringCaption = "You're done for today";
    progress = 1;
  }

  const workedMinutes = record
    ? record.workedMinutes ?? Math.max(0, Math.round((correctedNow - Date.parse(record.checkIn)) / 60_000))
    : null;

  const handleCheckIn = () => {
    router.push({ pathname: "/scan", params: { mode: "check-in" } });
  };

  const handleCheckOut = () => {
    router.push({ pathname: "/scan", params: { mode: "check-out" } });
  };

  const header = (
    <Header
      avatar={
        <View
          style={[styles.avatar, { backgroundColor: colors.primarySoft }]}
          accessibilityLabel={`Signed in as ${user?.name ?? "unknown"}`}
        >
          <Text style={[styles.avatarText, { color: colors.primary }]}>{initials(user?.name ?? null)}</Text>
        </View>
      }
      title={firstName ? `${greeting(new Date(correctedNow).getHours())}, ${firstName}` : "Today"}
      subtitle={formatHeaderDate(new Date(correctedNow))}
      right={
        <Ionicons
          name="notifications-outline"
          size={22}
          color={colors.foreground}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      }
    />
  );

  if (today.isError) {
    return (
      <Screen padded>
        {header}
        <View style={styles.stateBlock}>
          <AlertBox
            message={toFriendlyMessage(today.error)}
            tone="error"
            onRetry={() => void today.refetch()}
          />
        </View>
      </Screen>
    );
  }

  if (showSkeleton) {
    return (
      <Screen padded>
        {header}
        <TodaySkeleton />
      </Screen>
    );
  }

  if (today.isLoading) {
    // Data answered faster than the skeleton threshold: hold the header with
    // an empty body instead of flashing placeholders.
    return (
      <Screen padded>
        {header}
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      padded
      refreshing={today.isRefetching}
      onRefresh={() => void today.refetch()}
      // Content scrolls under the glass bar; keep the last card reachable.
      contentStyle={{ paddingBottom: tabBarPadding }}
    >
      {header}

      <View style={styles.ringSection}>
        <TimerRing state={state} label={ringLabel} caption={ringCaption} progress={progress} />
      </View>

      {showRestDayNotice ? (
        <View style={styles.notice}>
          <AlertBox tone="info" message={REST_DAY_NOTICE} />
        </View>
      ) : null}

      <CheckButton
        state={state}
        lockedLabel={checkInLockedLabel ?? undefined}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
      />

      <View style={styles.cards}>
        <TodayCard
          checkIn={record?.checkIn ?? null}
          checkOut={record?.checkOut ?? null}
          workedMinutes={workedMinutes}
        />
        {week.isError ? (
          <AlertBox
            tone="warning"
            message={toFriendlyMessage(week.error)}
            onRetry={() => void week.refetch()}
          />
        ) : (
          <WeekSummary
            daysPresent={week.data?.daysPresent ?? null}
            totalMinutes={week.data?.totalMinutes ?? null}
            loading={week.isLoading}
          />
        )}
      </View>
    </Screen>
  );
}

/**
 * Loading layout mirroring the real screen 1:1 — ring, check button and both
 * cards with matching inner structure — so nothing shifts when data arrives.
 */
function TodaySkeleton() {
  const { colors } = useTheme();
  return (
    <>
      <SkeletonCircle size={240} style={styles.skeletonRing} />
      <Skeleton height={56} borderRadius={999} />
      <View style={styles.skeletonCards}>
        <Card padding={spacing.lg}>
          <SkeletonText width={72} height={16} style={styles.skeletonHeading} />
          <View style={styles.skeletonColumns}>
            <SkeletonStatColumn labelWidth={52} valueWidth={72} />
            <View style={[styles.skeletonDivider, { backgroundColor: colors.border }]} />
            <SkeletonStatColumn labelWidth={62} valueWidth={88} />
          </View>
          <View style={[styles.skeletonWorkedRow, { backgroundColor: colors.muted }]}>
            <Skeleton width={18} height={18} borderRadius={6} />
            <SkeletonText width={52} height={12} />
            <View style={styles.skeletonFlex} />
            <SkeletonText width={72} height={12} />
          </View>
        </Card>
        <Card padding={spacing.lg}>
          <SkeletonText width={104} height={16} style={styles.skeletonHeading} />
          <View style={styles.skeletonColumns}>
            <SkeletonStat valueWidth={40} />
            <View style={styles.skeletonStatDivider} />
            <SkeletonStat valueWidth={64} />
          </View>
        </Card>
      </View>
    </>
  );
}

/** "Check in / Check out" column: dot + label line, then a value line. */
function SkeletonStatColumn({ labelWidth, valueWidth }: { labelWidth: number; valueWidth: number }) {
  return (
    <View style={styles.skeletonColumn}>
      <View style={styles.skeletonBadgeRow}>
        <Skeleton width={8} height={8} circle />
        <SkeletonText width={labelWidth} height={16} />
      </View>
      <Skeleton width={valueWidth} height={22} />
    </View>
  );
}

/** "Days present / Total hours" stat: icon, label line, then a value line. */
function SkeletonStat({ valueWidth }: { valueWidth: number }) {
  return (
    <View style={styles.skeletonColumn}>
      <Skeleton width={18} height={18} borderRadius={6} />
      <SkeletonText width={72} height={16} />
      <Skeleton width={valueWidth} height={22} />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  avatarText: {
    fontSize: fontSize.md,
    fontWeight: "800",
  },
  ringSection: {
    marginVertical: spacing.xl,
  },
  cards: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  notice: {
    marginBottom: spacing.md,
  },
  stateBlock: {
    flex: 1,
    justifyContent: "center",
  },
  skeletonRing: {
    alignSelf: "center",
    // Mirrors the real ring section's vertical margins (spacing.xl each side).
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  skeletonCards: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  skeletonHeading: {
    marginBottom: spacing.sm,
  },
  skeletonColumns: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
  },
  skeletonColumn: {
    flex: 1,
    gap: spacing.xs,
  },
  skeletonBadgeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs + 2,
  },
  skeletonDivider: {
    height: "100%",
    minHeight: 44,
    width: StyleSheet.hairlineWidth,
  },
  skeletonStatDivider: {
    alignSelf: "stretch",
    width: StyleSheet.hairlineWidth,
  },
  skeletonWorkedRow: {
    alignItems: "center",
    borderRadius: spacing.sm + 2,
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  skeletonFlex: {
    flex: 1,
  },
});
