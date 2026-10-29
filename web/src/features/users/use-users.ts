"use client";

import { useQuery } from "@tanstack/react-query";
import { listAdminUsers } from "./users.service";
import type { ListAdminUsersQuery } from "./users.service";

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
    ],
    queryFn: () => listAdminUsers(query),
  });
}
