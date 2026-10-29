"use client";

import {
  ArrowLeft,
  Inbox,
  ShieldAlert,
  UserRoundX,
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useAdminEmployer,
  useAdminEmployerEmployees,
  useApproveEmployer,
  useRejectEmployer,
  useSetEmployerSuspended,
} from "./use-employers";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { EmptyState } from "@/shared/components/empty-state";
import { TablePagination } from "@/shared/components/table-pagination";
import { apiErrorMessage } from "@/shared/lib/api";
import { formatDateTime } from "@/shared/lib/format";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import type { AccountStatus } from "@/shared/types/auth";

const EMPLOYEE_PAGE_SIZE = 10;

function statusBadge(
  status: AccountStatus,
): { variant: "warning" | "success" | "destructive"; label: string } {
  if (status === "PENDING") {
    return { variant: "warning", label: "Pending" };
  }
  if (status === "APPROVED") {
    return { variant: "success", label: "Approved" };
  }
  return { variant: "destructive", label: "Rejected" };
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}

export function AdminEmployerDetailsPage({ id }: { id: string }) {
  const employer = useAdminEmployer(id);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [suspendTarget, setSuspendTarget] = useState<{ activating: boolean } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const details = employer.data;
  const status: AccountStatus = details?.status ?? "PENDING";
  const employees = useAdminEmployerEmployees(id, { status, search, page, limit: EMPLOYEE_PAGE_SIZE });

  const approve = useApproveEmployer();
  const reject = useRejectEmployer();
  const setSuspended = useSetEmployerSuspended();

  function handleApprove() {
    approve.mutate(id, {
      onSuccess: () => toast.success("Employer approved"),
      onError: (error) => toast.error(apiErrorMessage(error)),
    });
  }

  function handleReject() {
    reject.mutate(
      { id, reason: rejectReason },
      {
        onSuccess: () => toast.success("Employer rejected"),
        onError: (error) => toast.error(apiErrorMessage(error)),
        onSettled: () => {
          setRejectOpen(false);
          setRejectReason("");
        },
      },
    );
  }

  function handleToggleActive() {
    if (!suspendTarget) {
      return;
    }
    setSuspended.mutate(
      { id, isActive: suspendTarget.activating },
      {
        onSuccess: () =>
          toast.success(suspendTarget.activating ? "Employer reactivated" : "Employer suspended"),
        onError: (error) => toast.error(apiErrorMessage(error)),
        onSettled: () => setSuspendTarget(null),
      },
    );
  }

  if (employer.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (employer.isError || !details) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/employers">
            <ArrowLeft aria-hidden="true" />
            All employers
          </Link>
        </Button>
        <Alert variant="destructive">
          <ShieldAlert aria-hidden="true" />
          <AlertTitle>Failed to load employer</AlertTitle>
          <AlertDescription>
            {apiErrorMessage(employer.error) ?? "Employer not found."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const badge = statusBadge(details.status);
  const employeeRows = employees.data?.items ?? [];
  const employeeTotalPages = employees.data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/employers">
            <ArrowLeft aria-hidden="true" />
            All employers
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{details.name}</h1>
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {details.status === "APPROVED" && !details.isActive ? (
              <Badge variant="destructive">Inactive</Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {details.company ? `${details.company} · ` : ""}
            {details.email}
          </p>
          {details.status === "REJECTED" && details.rejectionReason ? (
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              Rejection reason: <span className="font-medium">{details.rejectionReason}</span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {details.status === "PENDING" ? (
            <>
              <Button onClick={handleApprove} disabled={approve.isPending || reject.isPending}>
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => setRejectOpen(true)}
                disabled={approve.isPending || reject.isPending}
              >
                Reject
              </Button>
            </>
          ) : details.status === "APPROVED" ? (
            <Button
              variant={details.isActive ? "outline" : "default"}
              disabled={setSuspended.isPending}
              onClick={() => setSuspendTarget({ activating: !details.isActive })}
            >
              {details.isActive ? "Suspend" : "Reactivate"}
            </Button>
          ) : (
            <Badge variant="muted">No actions available</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Employees" value={String(details.employeesCount ?? 0)} />
        <StatTile label="Registered" value={formatDateTime(details.createdAt)} />
        <StatTile
          label="Last activity"
          value={details.lastActivityAt ? formatDistanceToNow(parseISO(details.lastActivityAt), { addSuffix: true }) : "—"}
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Employees</CardTitle>
            <CardDescription>
              {details.status === "APPROVED"
                ? "Read-only list of this employer's employee accounts."
                : "Employees are listed once the employer is approved."}
            </CardDescription>
          </div>
          {details.status === "APPROVED" ? (
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search employees"
              className="max-w-xs"
              aria-label="Search employees"
            />
          ) : null}
        </CardHeader>
        <CardContent>
          {details.status !== "APPROVED" ? (
            <EmptyState
              icon={Inbox}
              title="No employee list"
              description={
                details.status === "PENDING"
                  ? "This employer has not been approved yet."
                  : "This employer was rejected, so their data stays private."
              }
            />
          ) : employees.isError ? (
            <Alert variant="destructive">
              <ShieldAlert aria-hidden="true" />
              <AlertTitle>Failed to load employees</AlertTitle>
              <AlertDescription>{apiErrorMessage(employees.error)}</AlertDescription>
            </Alert>
          ) : employees.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : employeeRows.length === 0 ? (
            <EmptyState icon={UserRoundX} title="No employees found" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Department</TableHead>
                    <TableHead className="text-right">Last activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeRows.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {employee.email}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                        {employee.department ?? "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDateTime(employee.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {employeeTotalPages > 1 ? (
                <div className="mt-4 flex justify-end">
                  <TablePagination
                    page={page}
                    totalPages={employeeTotalPages}
                    onPageChange={setPage}
                  />
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={rejectOpen}
        title="Reject employer"
        description={`${details.name} will not be able to sign in. You can optionally add a reason shown to them at login.`}
        confirmLabel="Reject"
        destructive
        isConfirming={reject.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setRejectOpen(false);
            setRejectReason("");
          }
        }}
        onConfirm={handleReject}
      >
        <Input
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          placeholder="Optional reason"
          maxLength={200}
          disabled={reject.isPending}
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={suspendTarget !== null}
        title={suspendTarget?.activating ? "Reactivate employer" : "Suspend employer"}
        description={
          suspendTarget?.activating
            ? `${details.name} will regain access, including their employee accounts.`
            : `${details.name}'s account and all employee accounts will be disabled immediately; open sessions are revoked. You can reactivate at any time.`
        }
        confirmLabel={suspendTarget?.activating ? "Reactivate" : "Suspend"}
        destructive={suspendTarget !== null && !suspendTarget.activating}
        isConfirming={setSuspended.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setSuspendTarget(null);
          }
        }}
        onConfirm={handleToggleActive}
      />
    </div>
  );
}
