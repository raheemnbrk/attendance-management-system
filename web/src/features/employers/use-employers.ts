"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveEmployer,
  getAdminEmployer,
  listAdminEmployerEmployees,
  listAdminEmployers,
  rejectEmployer,
  setEmployerSuspended,
} from "./employers.service";
import type {
  EmployerEmployeesQuery,
  EmployerStatus,
  ListAdminEmployersQuery,
} from "./employers.service";

// Every admin mutation invalidates the same key family so that list pages,
// the dashboard counts, the activity feed and the users list all refresh.
function useInvalidateAdminData() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-employers"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-activity"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };
}

export function useAdminEmployers(query: ListAdminEmployersQuery) {
  return useQuery({
    queryKey: [
      "admin-employers",
      "list",
      query.status,
      query.search ?? null,
      query.page,
      query.limit,
    ],
    queryFn: () => listAdminEmployers(query),
  });
}

export function useAdminEmployer(id: string) {
  return useQuery({
    queryKey: ["admin-employers", "detail", id],
    queryFn: () => getAdminEmployer(id),
    enabled: id.length > 0,
  });
}

export function useAdminEmployerEmployees(
  id: string,
  query: EmployerEmployeesQuery & { status: EmployerStatus },
) {
  const { status, ...rest } = query;
  return useQuery({
    queryKey: ["admin-employers", "employees", id, rest.search ?? null, rest.page, rest.limit],
    queryFn: () => listAdminEmployerEmployees(id, rest),
    // Only fetch for employers that can have readable employees.
    enabled: id.length > 0 && status === "APPROVED",
  });
}

export function useApproveEmployer() {
  const invalidate = useInvalidateAdminData();

  return useMutation({
    mutationFn: (id: string) => approveEmployer(id),
    onSuccess: invalidate,
  });
}

export function useRejectEmployer() {
  const invalidate = useInvalidateAdminData();

  return useMutation({
    mutationFn: (args: { id: string; reason?: string }) => rejectEmployer(args.id, args.reason),
    onSuccess: invalidate,
  });
}

export function useSetEmployerSuspended() {
  const invalidate = useInvalidateAdminData();

  return useMutation({
    mutationFn: (args: { id: string; isActive: boolean }) =>
      setEmployerSuspended(args.id, args.isActive),
    onSuccess: invalidate,
  });
}
