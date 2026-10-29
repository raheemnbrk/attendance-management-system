"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAdminActivity, fetchAdminStats, fetchAdminTrends } from "./admin.service";

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
  });
}

export function useAdminTrends(days: 7 | 30) {
  return useQuery({
    queryKey: ["admin-trends", days],
    queryFn: () => fetchAdminTrends(days),
  });
}

export function useAdminActivity(limit = 10) {
  return useQuery({
    queryKey: ["admin-activity", limit],
    queryFn: () => fetchAdminActivity(limit),
  });
}
