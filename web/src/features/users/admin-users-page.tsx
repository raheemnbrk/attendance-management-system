"use client";

import { Inbox, ShieldAlert, UserRoundSearch } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useAdminUsers,
} from "./use-users";
import { EmptyState } from "@/shared/components/empty-state";
import { TablePagination } from "@/shared/components/table-pagination";
import { apiErrorMessage } from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/format";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
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
import type { AccountStatus, Role } from "@/shared/types/auth";

const PAGE_SIZE = 10;

// Radix Select forbids empty-string values, so "all" is the unset sentinel.
const ROLE_OPTIONS: { value: Role | "all"; label: string }[] = [
  { value: "all", label: "All roles" },
  { value: "ADMIN", label: "Admins" },
  { value: "EMPLOYER", label: "Employers" },
  { value: "EMPLOYEE", label: "Employees" },
];

const STATUS_OPTIONS: { value: AccountStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function roleBadge(role: Role): { variant: "muted" | "info" | "success"; label: string } {
  if (role === "ADMIN") {
    return { variant: "info", label: "Admin" };
  }
  if (role === "EMPLOYER") {
    return { variant: "success", label: "Employer" };
  }
  return { variant: "muted", label: "Employee" };
}

function accountStatusLabel(status: AccountStatus): string {
  if (status === "PENDING") {
    return "Pending";
  }
  if (status === "APPROVED") {
    return "Approved";
  }
  return "Rejected";
}

export function AdminUsersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role | "all">("all");
  const [status, setStatus] = useState<AccountStatus | "all">("all");
  const [page, setPage] = useState(1);

  // Debounce: only query once typing pauses for 300ms.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Reflect filters in the URL so views can be shared (best effort).
  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) {
      params.set("search", search.trim());
    }
    if (role !== "all") {
      params.set("role", role);
    }
    if (status !== "all") {
      params.set("status", status);
    }
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/admin/users?${query}` : "/admin/users");
  }, [search, role, status]);

  const users = useAdminUsers({
    search,
    role: role === "all" ? undefined : role,
    status: status === "all" ? undefined : status,
    page,
    limit: PAGE_SIZE,
  });

  const rows = useMemo(() => users.data?.items ?? [], [users.data]);
  const totalPages = users.data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Every account on the platform — admins, employers and employees.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Platform users</CardTitle>
            <CardDescription>
              {users.isLoading
                ? "Loading users…"
                : `${users.data?.total ?? 0} user${(users.data?.total ?? 0) === 1 ? "" : "s"}`}
            </CardDescription>
          </div>
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name, email or company"
            className="max-w-xs"
            aria-label="Search users"
          />
        </CardHeader>
        <div className="flex flex-wrap gap-3 px-6 pb-4">
          <Select
            value={role}
            onValueChange={(value) => {
              setRole(value as Role | "all");
              setPage(1);
            }}
          >
            <SelectTrigger size="sm" aria-label="Filter by role" className="w-40">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as AccountStatus | "all");
              setPage(1);
            }}
          >
            <SelectTrigger size="sm" aria-label="Filter by status" className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <CardContent>
          {users.isError ? (
            <Alert variant="destructive">
              <ShieldAlert aria-hidden="true" />
              <AlertTitle>Failed to load users</AlertTitle>
              <AlertDescription>{apiErrorMessage(users.error)}</AlertDescription>
            </Alert>
          ) : users.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={search.trim() ? UserRoundSearch : Inbox}
              title={search.trim() ? "No matches" : "No users"}
              description={search.trim() ? "No users match your filters." : "No accounts yet."}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden lg:table-cell">Employer</TableHead>
                    <TableHead className="hidden xl:table-cell">Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((user) => {
                    const badge = roleBadge(user.role);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <p className="font-medium">{user.name}</p>
                          {user.role === "EMPLOYER" && user.company ? (
                            <p className="text-xs text-muted-foreground">{user.company}</p>
                          ) : null}
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                          {user.role === "EMPLOYEE" ? (user.employerName ?? "—") : "—"}
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground xl:table-cell">
                          {user.role === "EMPLOYEE" ? (user.department ?? "—") : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.status !== "APPROVED" ? (
                              <Badge
                                variant={
                                  user.status === "PENDING" ? "warning" : "destructive"
                                }
                              >
                                {accountStatusLabel(user.status)}
                              </Badge>
                            ) : null}
                            <Badge variant={user.isActive ? "success" : "muted"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                          {formatDate(user.createdAt.slice(0, 10))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {totalPages > 1 ? (
                <div className="mt-4 flex justify-end">
                  <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
