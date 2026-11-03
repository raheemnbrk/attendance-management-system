import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { monthKey } from "@/shared/lib/date";
import { queryKeys } from "@/shared/lib/query-client";
import {
  checkInRequest,
  checkOutRequest,
  fetchHistoryPage,
  fetchMonthRecords,
  fetchMonthSummary,
  fetchToday,
  fetchWeekSummary,
  type ServerStamp,
} from "./api";
import type { AttendanceRecord, MonthSummary, PaginatedAttendance, WeekSummary } from "./types";

export type TodayData = {
  record: AttendanceRecord | null;
  /** Milliseconds of (server - phone) clock drift, measured at fetch time. */
  serverOffsetMs: number | null;
};

export function useTodayQuery() {
  return useQuery<TodayData>({
    queryKey: queryKeys.today(),
    queryFn: async () => {
      const stamped = await fetchToday();
      return {
        record: stamped.data,
        serverOffsetMs: stamped.serverTime === null ? null : stamped.serverTime - Date.now(),
      };
    },
  });
}

export function useWeekSummaryQuery() {
  return useQuery<WeekSummary>({
    queryKey: queryKeys.week(),
    queryFn: async () => (await fetchWeekSummary()).data,
  });
}

export function useMonthSummaryQuery(monthDate: Date) {
  const month = monthKey(monthDate);
  return useQuery<MonthSummary>({
    queryKey: queryKeys.monthSummary(month),
    queryFn: async () => (await fetchMonthSummary(month)).data,
  });
}

export function useMonthRecordsQuery(monthDate: Date) {
  const month = monthKey(monthDate);
  return useQuery<PaginatedAttendance>({
    queryKey: queryKeys.month(month),
    queryFn: async () => (await fetchMonthRecords(month)).data,
    staleTime: 15_000,
  });
}

export function useHistoryInfiniteQuery(monthDate: Date) {
  const month = monthKey(monthDate);
  return useInfiniteQuery({
    queryKey: queryKeys.history(month),
    queryFn: async ({ pageParam }) => (await fetchHistoryPage(month, pageParam as number)).data,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });
}

function invalidateAttendance(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: ["attendance"] });
}

/** POST /attendance/check-in — refreshing all attendance data afterwards. */
export function useCheckIn(): UseMutationResult<AttendanceRecord, unknown, string> {
  const queryClient = useQueryClient();
  return useMutation<AttendanceRecord, unknown, string>({
    mutationFn: async (qrCode) => (await checkInRequest(qrCode)).data,
    onSuccess: () => invalidateAttendance(queryClient),
  });
}

/** POST /attendance/check-out — refreshing all attendance data afterwards. */
export function useCheckOut(): UseMutationResult<AttendanceRecord, unknown, string> {
  const queryClient = useQueryClient();
  return useMutation<AttendanceRecord, unknown, string>({
    mutationFn: async (qrCode) => (await checkOutRequest(qrCode)).data,
    onSuccess: () => invalidateAttendance(queryClient),
  });
}
