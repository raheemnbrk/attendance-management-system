import { QueryClient } from "@tanstack/react-query";

export const queryKeys = {
  session: () => ["session"] as const,
  today: () => ["attendance", "today"] as const,
  week: () => ["attendance", "week"] as const,
  monthSummary: (month: string) => ["attendance", "summary", month] as const,
  month: (month: string) => ["attendance", "month", month] as const,
  history: (month: string) => ["attendance", "history", month] as const,
  me: () => ["users", "me"] as const,
} as const;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
