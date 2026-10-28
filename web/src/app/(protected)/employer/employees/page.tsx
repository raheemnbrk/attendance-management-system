"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, RotateCcw, Search, UserX, Users } from "lucide-react";
import { ApiError } from "@/shared/types/api";
import { formatDate } from "@/shared/lib/format";
import {
  useCreateEmployee,
  useResetEmployeePassword,
  useSetEmployeeActive,
  useEmployees,
  useUpdateEmployee,
} from "@/features/employees/use-employees";
import type { Employee } from "@/features/employees/employees.service";
import { CreateEmployeeForm, EditEmployeeForm } from "@/features/employees/employee-form";
import type {
  CreateEmployeeFormValues,
  EditEmployeeFormValues,
} from "@/features/employees/employees.schema";
import { TemporaryPasswordDialog } from "@/features/employees/temporary-password-dialog";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { EmptyState } from "@/shared/components/empty-state";
import { TablePagination } from "@/shared/components/table-pagination";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

const PAGE_SIZE = 10;

function apiErrorMessage(error: unknown): string | null {
  return error instanceof ApiError ? error.message : null;
}

function EmployeeRowActions({
  employee,
  onEdit,
  onResetPassword,
  onToggleActive,
}: {
  employee: Employee;
  onEdit: () => void;
  onResetPassword: () => void;
  onToggleActive: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${employee.name}`}>
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onResetPassword}>
          <RotateCcw aria-hidden="true" />
          Reset password
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onToggleActive}>
          <UserX aria-hidden="true" />
          {employee.isActive ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function EmployeesPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Employee | null>(null);

  // Open the "Add employee" dialog when the dashboard quick action links here
  // with ?new=1. Read directly from location to avoid suspending the page.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") {
      setAddOpen(true);
      router.replace("/employer/employees");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce the search box and reset pagination when filters change.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const { data: employees, isPending } = useEmployees({
    search: search || undefined,
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
  });

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const resetPassword = useResetEmployeePassword();
  const setActive = useSetEmployeeActive();

  const total = employees?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = employees?.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE) ?? [];

  function handleCreate(values: CreateEmployeeFormValues) {
    createEmployee.mutate(
      {
        name: values.name,
        email: values.email,
        ...(values.department ? { department: values.department } : {}),
      },
      {
        onSuccess: (data) => {
          setAddOpen(false);
          toast.success(`${data.employee.name} added`);
          if (data.temporaryPassword) {
            setTempPassword(data.temporaryPassword);
          }
        },
        onError: (error) => toast.error(apiErrorMessage(error) ?? "Could not create employee"),
      },
    );
  }

  function handleEditSubmit(values: EditEmployeeFormValues) {
    if (!editTarget) {
      return;
    }

    updateEmployee.mutate(
      {
        id: editTarget.id,
        input: {
          name: values.name,
          ...(values.department ? { department: values.department } : {}),
        },
      },
      {
        onSuccess: (employee) => {
          setEditTarget(null);
          toast.success(`${employee.name} updated`);
        },
        onError: (error) => toast.error(apiErrorMessage(error) ?? "Could not update employee"),
      },
    );
  }

  function handleResetPassword(employee: Employee) {
    resetPassword.mutate(employee.id, {
      onSuccess: (data) => {
        if (data.temporaryPassword) {
          setTempPassword(data.temporaryPassword);
          toast.success(`Password reset for ${employee.name}`);
        }
      },
      onError: (error) => toast.error(apiErrorMessage(error) ?? "Could not reset password"),
    });
  }

  function handleToggleActive(employee: Employee) {
    setActive.mutate(
      { id: employee.id, isActive: !employee.isActive },
      {
        onSuccess: (updated) => {
          setConfirmTarget(null);
          toast.success(
            updated.isActive ? `${updated.name} activated` : `${updated.name} deactivated`,
          );
        },
        onError: (error) => toast.error(apiErrorMessage(error) ?? "Could not update employee"),
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground">Manage the people in your team</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus aria-hidden="true" />
          Add employee
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="pl-8"
            placeholder="Search name or email"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Search employees"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
        >
          <SelectTrigger className="w-36" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : total === 0 ? (
        <EmptyState
          icon={Users}
          title="Add your first employee"
          description="Employees can check in and out once you add them here."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus aria-hidden="true" />
              Add employee
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/employer/employees/${employee.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {employee.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{employee.email}</TableCell>
                  <TableCell>{employee.department ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={employee.isActive ? "success" : "muted"}>
                      {employee.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(employee.createdAt.slice(0, 10))}
                  </TableCell>
                  <TableCell className="text-right">
                    <EmployeeRowActions
                      employee={employee}
                      onEdit={() => setEditTarget(employee)}
                      onResetPassword={() => handleResetPassword(employee)}
                      onToggleActive={() => setConfirmTarget(employee)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Add employee */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add employee</DialogTitle>
            <DialogDescription>
              The employee signs in with their email and the temporary password.
            </DialogDescription>
          </DialogHeader>
          <CreateEmployeeForm
            onSubmit={handleCreate}
            isSubmitting={createEmployee.isPending}
            apiError={apiErrorMessage(createEmployee.error)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="create-employee-form" isLoading={createEmployee.isPending}>
              Add employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit employee */}
      <Dialog open={editTarget != null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit employee</DialogTitle>
            <DialogDescription>{editTarget?.email}</DialogDescription>
          </DialogHeader>
          {editTarget ? (
            <>
              <EditEmployeeForm
                key={editTarget.id}
                employee={editTarget}
                onSubmit={handleEditSubmit}
                isSubmitting={updateEmployee.isPending}
                apiError={apiErrorMessage(updateEmployee.error)}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditTarget(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="edit-employee-form"
                  isLoading={updateEmployee.isPending}
                >
                  Save changes
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Activate / deactivate confirmation */}
      <ConfirmDialog
        open={confirmTarget != null}
        title={confirmTarget?.isActive ? "Deactivate employee" : "Activate employee"}
        description={
          confirmTarget?.isActive
            ? `${confirmTarget.name} will no longer be able to sign in or check in. Their data is kept.`
            : `${confirmTarget?.name ?? "This employee"} will be able to sign in again.`
        }
        confirmLabel={confirmTarget?.isActive ? "Deactivate" : "Activate"}
        destructive={confirmTarget?.isActive === true}
        isConfirming={setActive.isPending}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        onConfirm={() => confirmTarget && handleToggleActive(confirmTarget)}
      />

      {/* Temporary password (created or reset) */}
      <TemporaryPasswordDialog
        password={tempPassword}
        title="Temporary password"
        description="Share this password with the employee."
        onClose={() => setTempPassword(null)}
      />
    </div>
  );
}
