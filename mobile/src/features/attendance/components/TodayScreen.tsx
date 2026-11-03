import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { toFriendlyMessage } from "@/shared/api/errors";
import { Alert as AlertBox } from "@/shared/components/ui/Alert";
import { Card } from "@/shared/components/ui/Card";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { Button } from "@/shared/components/ui/Button";
import { Header } from "@/shared/components/layout/Header";
import { Screen } from "@/shared/components/layout/Screen";
import { useTabBarHeight } from "@/shared/components/navigation/use-tab-bar-height";
import { formatElapsedClock, formatHeaderDate, formatTime12, formatWorkedMinutes } from "@/shared/lib/date";
import { fontSize, radius, spacing } from "@/shared/theme/colors";
import { useTheme } from "@/shared/theme/theme-provider";
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

  const now = useTick(today.data?.record?.checkOut ? 30_000 : 1_000);

  const offsetMs = today.data?.serverOffsetMs ?? 0;
  const correctedNow = now + offsetMs;
  const record = today.data?.record ?? null;
  const state: TodayState =
    !record || today.isLoading ? (record ? "working" : "idle") : record.checkOut ? "done" : "working";

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

  if (today.isError) {
    return (
      <Screen padded>
        <Header
          title={firstName ? `${greeting(new Date(correctedNow).getHours())}, ${firstName}` : "Today"}
          subtitle={formatHeaderDate(new Date(correctedNow))}
        />
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

  if (today.isLoading) {
    return (
      <Screen padded>
        <Header
          title={firstName ? `${greeting(new Date().getHours())}, ${firstName}` : "Today"}
          subtitle={formatHeaderDate(new Date(new Date().getTime() + offsetMs))}
        />
        <View style={styles.skeletonWrap}>
          <Skeleton width={240} height={240} circle />
          <Card padding={spacing.lg} style={styles.skeletonCard}>
            <Skeleton height={14} />
            <Skeleton height={20} style={{ marginTop: spacing.md }} />
          </Card>
          <Card padding={spacing.lg} style={styles.skeletonCard}>
            <Skeleton height={14} />
            <Skeleton height={20} style={{ marginTop: spacing.md }} />
          </Card>
        </View>
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

      <View style={styles.ringSection}>
        <TimerRing state={state} label={ringLabel} caption={ringCaption} progress={progress} />
      </View>

      <CheckButton
        state={state}
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
  skeletonWrap: {
    alignItems: "center",
    flex: 1,
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  skeletonCard: {
    width: "100%",
  },
  stateBlock: {
    flex: 1,
    justifyContent: "center",
  },
});
