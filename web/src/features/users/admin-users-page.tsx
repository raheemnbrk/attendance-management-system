"use client";

import {
  ArrowDown,
  ArrowUp,
  Inbox,
  Search,
  UserRoundSearch,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/shared/components/empty-state";
import { QueryErrorAlert } from "@/shared/components/query-error-alert";
import { TablePagination } from "@/shared/components/table-pagination";
import { apiErrorMessage } from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
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
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { DEFAULT_USERS_QUERY, usersQuerySchema } from "./users.schema";
import { useAdminUsers, useUserRoleCounts } from "./use-users";
import type {
  AdminUserRow,
  UsersQuery,
  UsersRoleFilter,
  UsersSortBy,
  UsersSortOrder,
  UsersStatusFilter,
} from "./users.types";

type RoleTab = {
  value: UsersRoleFilter;
  label: string;
  countKey: "all" | "admin" | "employer" | "employee";
};

const ROLE_TABS: RoleTab[] = [
  { value: "all", label: "All", countKey: "all" },
  { value: "ADMIN", label: "Admin", countKey: "admin" },
  { value: "EMPLOYER", label: "Employer", countKey: "employer" },
  { value: "EMPLOYEE", label: "Employee", countKey: "employee" },
];

const STATUS_OPTIONS: { value: UsersStatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function roleVariant(role: AdminUserRow["role"]): "default" | "info" | "muted" {
  if (role === "ADMIN") {
    return "default";
  }
  if (role === "EMPLOYER") {
    return "info";
  }
  return "muted";
}

function statusVariant(status: AdminUserRow["status"]): "warning" | "success" | "destructive" {
  if (status === "PENDING") {
    return "warning";
  }
  if (status === "APPROVED") {
    return "success";
  }
  return "destructive";
}

function statusLabel(status: AdminUserRow["status"]): string {
  if (status === "PENDING") {
    return "Pending";
  }
  if (status === "APPROVED") {
    return "Approved";
  }
  return "Rejected";
}

function employerLabel(user: AdminUserRow): string {
  if (user.role !== "EMPLOYEE" || !user.employer) {
    return "—";
  }
  return user.employer.name || user.employer.company || "—";
}

function SortableHead({
  label,
  column,
  activeColumn,
  activeOrder,
  onSort,
}: {
  label: string;
  column: UsersSortBy;
  activeColumn: UsersSortBy;
  activeOrder: UsersSortOrder;
  onSort: (column: UsersSortBy) => void;
}) {
  const isActive = activeColumn === column;
  const ArrowIcon = isActive ? (activeOrder === "asc" ? ArrowUp : ArrowDown) : null;

  return (
    <TableHead aria-sort={isActive ? (activeOrder === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {label}
        {ArrowIcon ? <ArrowIcon aria-hidden="true" className="size-3" /> : null}
      </button>
    </TableHead>
  );
}

function NameCell({ user }: { user: AdminUserRow }) {
  const initials = getInitials(user.name);
  const body = (
    <>
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {initials}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{user.name}</span>
        <span className="truncate text-xs text-muted-foreground">{user.email}</span>
      </div>
    </>
  );

  if (user.role === "EMPLOYER") {
    return (
      <Link
        href={`/admin/employers/${user.id}`}
        className="flex min-w-0 items-center gap-3 underline-offset-4 hover:underline"
      >
        {body}
      </Link>
    );
  }

  return <div className="flex min-w-0 items-center gap-3">{body}</div>;
}

function UsersPageInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const query = useMemo<UsersQuery>(() => {
    const parsed = usersQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    return parsed.success ? { ...DEFAULT_USERS_QUERY, ...parsed.data } : DEFAULT_USERS_QUERY;
  }, [searchParams]);

  const goTo = useCallback(
    (next: UsersQuery, mode: "push" | "replace") => {
      const params = new URLSearchParams();
      const search = next.search.trim();
      if (search) {
        params.set("search", search);
      }
      if (next.role !== "all") {
        params.set("role", next.role);
      }
      if (next.status !== "all") {
        params.set("status", next.status);
      }
      params.set("page", String(next.page));
      params.set("limit", String(next.limit));
      params.set("sortBy", next.sortBy);
      params.set("sortOrder", next.sortOrder);
      const url = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      router[mode](url, { scroll: false });
    },
    [pathname, router],
  );

  // Changing a filter resets to page 1; only the page control moves pages.
  const applyFilter = useCallback(
    (patch: Partial<UsersQuery>) => {
      goTo({ ...query, ...patch, page: 1 }, "push");
    },
    [goTo, query],
  );

  const toggleSort = useCallback(
    (column: UsersSortBy) => {
      if (query.sortBy === column) {
        goTo(
          { ...query, sortOrder: query.sortOrder === "asc" ? "desc" : "asc" },
          "push",
        );
        return;
      }
      goTo({ ...query, sortBy: column, sortOrder: "asc" }, "push");
    },
    [goTo, query],
  );

  const hasFilters =
    query.search.trim().length > 0 || query.role !== "all" || query.status !== "all";

  const users = useAdminUsers({
    search: query.search.trim() || undefined,
    role: query.role === "all" ? undefined : query.role,
    status: query.status === "all" ? undefined : query.status,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });
  const counts = useUserRoleCounts();

  const [searchInput, setSearchInput] = useState(query.search);
  const [committedSearch, setCommittedSearch] = useState(query.search);

  // Back/forward navigation: resync the input with whatever the URL controls.
  useEffect(() => {
    setSearchInput(query.search);
    setCommittedSearch(query.search);
  }, [query.search]);

  // Debounce: only commit once typing pauses for 300ms.
  useEffect(() => {
    if (searchInput === committedSearch) {
      return;
    }
    const timer = window.setTimeout(() => {
      setCommittedSearch(searchInput);
      goTo({ ...query, search: searchInput, page: 1 }, "replace");
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput, committedSearch, goTo, query]);

  const rows = users.data?.items ?? [];
  const total = users.data?.total ?? 0;
  const totalPages = users.data?.totalPages ?? 1;

  const clearFilters = useCallback(() => {
    applyFilter({ search: "", role: "all", status: "all" });
  }, [applyFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Every account on the platform — admins, employers and employees.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Platform users</CardTitle>
            <CardDescription>
              {users.isLoading ? "Loading users…" : `${total} user${total === 1 ? "" : "s"}`}
            </CardDescription>
          </div>
          <div className="relative w-full md:max-w-xs">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name, email, company or department"
              className="pr-9 pl-9"
              aria-label="Search users"
            />
            {searchInput ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
                aria-label="Clear search"
                onClick={() => setSearchInput("")}
              >
                <X />
              </Button>
            ) : null}
          </div>
        </CardHeader>

        <div className="flex flex-col gap-3 px-6 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={query.role} onValueChange={(value) => applyFilter({ role: value as UsersRoleFilter })}>
            <TabsList aria-label="Filter by role">
              {ROLE_TABS.map((tab) => {
                const count = counts.data?.[tab.countKey];
                return (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                    {counts.isLoading ? (
                      <Skeleton className="h-4 w-6 rounded-full" />
                    ) : count !== undefined ? (
                      <Badge variant="muted">{count}</Badge>
                    ) : null}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={query.status}
              onValueChange={(value) => applyFilter({ status: value as UsersStatusFilter })}
            >
              <SelectTrigger size="sm" className="w-36" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters ? (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X aria-hidden="true" />
                Clear filters
              </Button>
            ) : null}
          </div>
        </div>

        <CardContent>
          {users.isError ? (
            <QueryErrorAlert
              title="Failed to load users"
              error={users.error}
              onRetry={() => void users.refetch()}
              isRetrying={users.isRefetching}
            />
          ) : users.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={hasFilters ? UserRoundSearch : Inbox}
              title={hasFilters ? "No users found" : "No users yet"}
              description={
                hasFilters
                  ? "No users match your filters."
                  : "Accounts show up here as soon as they exist."
              }
              action={
                hasFilters ? (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHead
                        label="Name"
                        column="name"
                        activeColumn={query.sortBy}
                        activeOrder={query.sortOrder}
                        onSort={toggleSort}
                      />
                      <TableHead>Role</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Employer</TableHead>
                      <TableHead>Status</TableHead>
                      <SortableHead
                        label="Created"
                        column="createdAt"
                        activeColumn={query.sortBy}
                        activeOrder={query.sortOrder}
                        onSort={toggleSort}
                      />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="max-w-[16rem]">
                          <NameCell user={user} />
                        </TableCell>
                        <TableCell>
                          <Badge variant={roleVariant(user.role)}>{user.role}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.company ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.department ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {employerLabel(user)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant={statusVariant(user.status)}>{statusLabel(user.status)}</Badge>
                            <Badge variant={user.isActive ? "success" : "muted"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.createdAt.slice(0, 10))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4">
                <TablePagination
                  page={query.page}
                  totalPages={totalPages}
                  onPageChange={(page) => goTo({ ...query, page }, "push")}
                  total={total}
                  pageSize={query.limit}
                  onPageSizeChange={(limit) => applyFilter({ limit })}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminUsersPage() {
  return (
    <div className="min-h-40">
      <UsersPageInner />
    </div>
  );
}
