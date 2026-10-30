"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getUserRoleCounts, listAdminUsers } from "./users.service";
import type { ListAdminUsersQuery } from "./users.types";

export function useAdminUsers(query: ListAdminUsersQuery) {
  return useQuery({
    queryKey: [
      "admin-users",
      "list",
      query.search ?? null,
      query.role ?? null,
      query.status ?? null,
      query.page,
      query.limit,
      query.sortBy,
      query.sortOrder,
    ],
    queryFn: () => listAdminUsers(query),
    // The previous page's data stays on screen while the next page loads, so
    // the table does not flash empty while paging.
    placeholderData: keepPreviousData,
  });
}

export function useUserRoleCounts() {
  return useQuery({
    queryKey: ["admin-users", "counts"],
    queryFn: getUserRoleCounts,
  });
}
