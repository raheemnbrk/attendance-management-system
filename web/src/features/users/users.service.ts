import { apiRequest, parsePaginated } from "@/shared/lib/api";
import type { Paginated } from "@/shared/types/api";
import type { AccountStatus, Role } from "@/shared/types/auth";

// Mirrors backend AdminUserRow (no password data anywhere).
export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  company: string | null;
  department: string | null;
  status: AccountStatus;
  isActive: boolean;
  createdAt: string;
  employerName: string | null;
};

export type ListAdminUsersQuery = {
  search?: string;
  role?: Role;
  status?: AccountStatus;
  page: number;
  limit: number;
};

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
    },
  });

  return parsePaginated<AdminUserRow>(data, "users list", (item) => item as AdminUserRow);
}
