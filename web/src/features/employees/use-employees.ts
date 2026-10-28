"use client";

import { useQuery } from "@tanstack/react-query";
import { getEmployee, listEmployees } from "./employees.service";
import type { ListEmployeesQuery } from "./employees.service";

export function useEmployees(query: ListEmployeesQuery = {}) {
  return useQuery({
    queryKey: ["employees", query.search ?? null, query.isActive ?? null],
    queryFn: () => listEmployees(query),
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ["employees", "detail", id],
    queryFn: () => getEmployee(id),
    enabled: id.length > 0,
  });
}
