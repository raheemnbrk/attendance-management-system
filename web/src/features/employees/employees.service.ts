import { apiRequest } from "@/shared/lib/api";
import type { AuthUser } from "@/shared/types/auth";

export type Employee = AuthUser;

export type ListEmployeesQuery = {
  search?: string;
  isActive?: boolean;
};

export async function listEmployees(query: ListEmployeesQuery = {}): Promise<Employee[]> {
  return apiRequest<Employee[]>({
    method: "GET",
    url: "/users/employees",
    params: {
      ...(query.search ? { search: query.search } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive ? "true" : "false" } : {}),
    },
  });
}

export async function getEmployee(id: string): Promise<Employee> {
  return apiRequest<Employee>({ method: "GET", url: `/users/employees/${id}` });
}
