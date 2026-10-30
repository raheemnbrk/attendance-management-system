import { apiRequest, parsePaginated } from "@/shared/lib/api";
import type { Paginated } from "@/shared/types/api";
import type { AdminUserRow, ListAdminUsersQuery, UserRoleCounts } from "./users.types";

export async function listAdminUsers(
  query: ListAdminUsersQuery,
): Promise<Paginated<AdminUserRow>> {
  const data = await apiRequest<unknown>({
    method: "GET",
    url: "/users",
    params: {
      ...(query.search ? { search: query.search } : {}),
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
  });

  return parsePaginated<AdminUserRow>(data, "users list", (item) => item as AdminUserRow);
}

export async function getUserRoleCounts(): Promise<UserRoleCounts> {
  return apiRequest<UserRoleCounts>({ method: "GET", url: "/users/counts" });
}
