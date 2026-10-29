import { apiRequest } from "@/shared/lib/api";
import type { Paginated } from "@/shared/types/api";
import type { AuthUser } from "@/shared/types/auth";

export type AdminEmployer = AuthUser;

export type EmployerStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ListAdminEmployersQuery = {
  status: EmployerStatus;
  search?: string;
  page: number;
  limit: number;
};

export type AdminEmployerDetails = AuthUser & {
  employeesCount: number;
  lastActivityAt: string | null;
};

export async function listAdminEmployers(
  query: ListAdminEmployersQuery,
): Promise<Paginated<AdminEmployer>> {
  return apiRequest<Paginated<AdminEmployer>>({
    method: "GET",
    url: "/users/employers",
    params: {
      status: query.status,
      ...(query.search ? { search: query.search } : {}),
      page: query.page,
      limit: query.limit,
    },
  });
}

export async function getAdminEmployer(id: string): Promise<AdminEmployerDetails> {
  return apiRequest<AdminEmployerDetails>({
    method: "GET",
    url: `/users/employers/${id}`,
  });
}

export type EmployerEmployeesQuery = {
  search?: string;
  page: number;
  limit: number;
};

// Read-only list of one employer's employees (no password hashes anywhere).
export async function listAdminEmployerEmployees(
  id: string,
  query: EmployerEmployeesQuery,
): Promise<Paginated<AuthUser>> {
  return apiRequest<Paginated<AuthUser>>({
    method: "GET",
    url: `/users/employers/${id}/employees`,
    params: {
      ...(query.search ? { search: query.search } : {}),
      page: query.page,
      limit: query.limit,
    },
  });
}

export async function approveEmployer(id: string): Promise<AdminEmployer> {
  return apiRequest<AdminEmployer>({
    method: "PATCH",
    url: `/users/employers/${id}/approve`,
    data: {},
  });
}

export async function rejectEmployer(id: string, reason?: string): Promise<AdminEmployer> {
  return apiRequest<AdminEmployer>({
    method: "PATCH",
    url: `/users/employers/${id}/reject`,
    data: { ...(reason?.trim() ? { reason: reason.trim() } : {}) },
  });
}

export async function setEmployerSuspended(id: string, isActive: boolean): Promise<AdminEmployer> {
  return apiRequest<AdminEmployer>({
    method: "PATCH",
    url: `/users/employers/${id}/${isActive ? "reactivate" : "suspend"}`,
    data: {},
  });
}
