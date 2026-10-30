import type { AccountStatus, Role } from "@/shared/types/auth";

export type UsersSortBy = "name" | "createdAt";
export type UsersSortOrder = "asc" | "desc";

export type UsersRoleFilter = Role | "all";
export type UsersStatusFilter = AccountStatus | "all";

// Full state of the users page; every field is mirrored in the URL query.
export type UsersQuery = {
  search: string;
  role: UsersRoleFilter;
  status: UsersStatusFilter;
  page: number;
  limit: number;
  sortBy: UsersSortBy;
  sortOrder: UsersSortOrder;
};

export type ListAdminUsersQuery = {
  search?: string;
  role?: Role;
  status?: AccountStatus;
  page: number;
  limit: number;
  sortBy: UsersSortBy;
  sortOrder: UsersSortOrder;
};

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
  employer: { id: string; name: string; company: string | null } | null;
};

export type UserRoleCounts = {
  all: number;
  admin: number;
  employer: number;
  employee: number;
};
