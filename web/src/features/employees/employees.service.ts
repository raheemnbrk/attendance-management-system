import { apiRequest } from "@/shared/lib/api";
import type { AuthUser } from "@/shared/types/auth";

export type Employee = AuthUser;

export type ListEmployeesQuery = {
  search?: string;
  isActive?: boolean;
};

export type CreateEmployeeInput = {
  name: string;
  email: string;
  department?: string;
};

export type CreateEmployeeResponse = {
  employee: Employee;
  temporaryPassword?: string;
};

export type UpdateEmployeeInput = {
  name?: string;
  department?: string;
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

export async function createEmployee(input: CreateEmployeeInput): Promise<CreateEmployeeResponse> {
  return apiRequest<CreateEmployeeResponse>({
    method: "POST",
    url: "/users/employees",
    data: {
      ...input,
      ...(input.department ? { department: input.department } : {}),
    },
  });
}

export async function updateEmployee(
  id: string,
  input: UpdateEmployeeInput,
): Promise<Employee> {
  return apiRequest<Employee>({
    method: "PATCH",
    url: `/users/employees/${id}`,
    data: input,
  });
}

export async function resetEmployeePassword(
  id: string,
): Promise<{ temporaryPassword?: string }> {
  return apiRequest<{ temporaryPassword?: string }>({
    method: "PATCH",
    url: `/users/employees/${id}/reset-password`,
    data: {},
  });
}

export async function setEmployeeActive(id: string, isActive: boolean): Promise<Employee> {
  return apiRequest<Employee>({
    method: "PATCH",
    url: `/users/employees/${id}/${isActive ? "activate" : "deactivate"}`,
    data: {},
  });
}

export type EmployerDepartments = {
  departments: string[];
  unassigned: boolean;
};

export async function listEmployerDepartments(): Promise<EmployerDepartments> {
  return apiRequest<EmployerDepartments>({ method: "GET", url: "/users/departments" });
}
