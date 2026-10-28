"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEmployee,
  getEmployee,
  listEmployees,
  resetEmployeePassword,
  setEmployeeActive,
  updateEmployee,
} from "./employees.service";
import type {
  CreateEmployeeInput,
  ListEmployeesQuery,
  UpdateEmployeeInput,
} from "./employees.service";

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

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => createEmployee(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: { id: string; input: UpdateEmployeeInput }) =>
      updateEmployee(args.id, args.input),
    onSuccess: (_data, args) => {
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      void queryClient.invalidateQueries({ queryKey: ["employees", "detail", args.id] });
    },
  });
}

export function useResetEmployeePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => resetEmployeePassword(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useSetEmployeeActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: { id: string; isActive: boolean }) =>
      setEmployeeActive(args.id, args.isActive),
    onSuccess: (_data, args) => {
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      void queryClient.invalidateQueries({ queryKey: ["employees", "detail", args.id] });
      // Activity feeds and summaries depend on active employees.
      void queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}
