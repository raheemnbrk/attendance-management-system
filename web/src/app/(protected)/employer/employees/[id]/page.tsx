"use client";

import Link from "next/link";
import { use, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, Download, MapPin, Pencil, RotateCcw, UserRound, UserRoundX } from "lucide-react";
import { ApiError } from "@/shared/types/api";
import {
  getAttendanceStatus,
} from "@/features/attendance/attendance.types";
import { useEmployeeReport } from "@/features/attendance/use-attendance";
import {
  useEmployee,
  useResetEmployeePassword,
  useSetEmployeeActive,
  useUpdateEmployee,
} from "@/features/employees/use-employees";
import type { EditEmployeeFormValues } from "@/features/employees/employees.schema";
import { EditEmployeeForm } from "@/features/employees/employee-form";
import { TemporaryPasswordDialog } from "@/features/employees/temporary-password-dialog";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { DateRangePicker, type DateRange } from "@/shared/components/date-range-picker";
import { EmptyState } from "@/shared/components/empty-state";
import { ExportMenu } from "@/shared/components/export-menu";
import { StatusBadge } from "@/shared/components/status-badge";
import { formatDate, formatDuration, formatTime, mapLink, todayLocalISO } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

function apiErrorMessage(error: unknown): string | null {
  return error instanceof ApiError ? error.message : null;
}

function StatTile({ label, value, isLoading }: { label: string; value: string; isLoading: boolean }) {
  return (
    <Card className="px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">
        {isLoading ? <Skeleton className="h-6 w-12" /> : value}
      </p>
    </Card>
  );
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const today = todayLocalISO();

  const [range, setRange] = useState<DateRange>(() => ({
    from: format(new Date(Date.now() - 29 * 86_400_000), "yyyy-MM-dd"),
    to: today,
  }));

  const { data: employee, isError: employeeError } = useEmployee(id);
  const { data: report, isPending: reportPending } = useEmployeeReport(id, range.from, range.to);

  const updateEmployee = useUpdateEmployee();
  const resetPassword = useResetEmployeePassword();
  const setActive = useSetEmployeeActive();

  const [editOpen, setEditOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [confirmActive, setConfirmActive] = useState(false);

  if (employeeError) {
    return (
      <EmptyState
        icon={UserRoundX}
        title="Employee not found"
        description="This employee does not exist or does not belong to you."
        action={
          <Button asChild variant="outline">
            <Link href="/employer/employees">
              <ArrowLeft aria-hidden="true" />
              Back to employees
            </Link>
          </Button>
        }
      />
    );
  }

  function handleEditSubmit(values: EditEmployeeFormValues) {
    updateEmployee.mutate(
      {
        id,
        input: {
          name: values.name,
          ...(values.department ? { department: values.department } : {}),
        },
      },
      {
        onSuccess: (updated) => {
          setEditOpen(false);
          toast.success(`${updated.name} updated`);
        },
        onError: (error) => toast.error(apiErrorMessage(error) ?? "Could not update employee"),
      },
    );
  }

  function handleResetPassword() {
    resetPassword.mutate(id, {
      onSuccess: (data) => {
        if (data.temporaryPassword) {
          setTempPassword(data.temporaryPassword);
          toast.success("Password reset");
        }
      },
      onError: (error) => toast.error(apiErrorMessage(error) ?? "Could not reset password"),
    });
  }

  function handleToggleActive() {
    if (!employee) {
      return;
    }

    setActive.mutate(
      { id: employee.id, isActive: !employee.isActive },
      {
        onSuccess: (updated) => {
          setConfirmActive(false);
          toast.success(updated.isActive ? `${updated.name} activated` : `${updated.name} deactivated`);
        },
        onError: (error) => toast.error(apiErrorMessage(error) ?? "Could not update employee"),
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-1 -ml-2 text-muted-foreground">
            <Link href="/employer/employees">
              <ArrowLeft aria-hidden="true" />
              Employees
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            {employee ? (
              <span className="flex items-center gap-3">
                {employee.name}
                <Badge variant={employee.isActive ? "success" : "muted"}>
                  {employee.isActive ? "Active" : "Inactive"}
                </Badge>
              </span>
            ) : (
              <Skeleton className="h-8 w-48" />
            )}
          </h1>
        </div>
        {employee ? (
          <div className="flex gap-2">
            <ExportMenu
              endpoint="attendance/export"
              params={{
                from: range.from,
                to: range.to,
                employeeId: employee.id,
              }}
              disabled={reportPending}
            />
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil aria-hidden="true" />
              Edit
            </Button>
            <Button variant="outline" onClick={handleResetPassword} isLoading={resetPassword.isPending}>
              <RotateCcw aria-hidden="true" />
              Reset password
            </Button>
          </div>
        ) : null}
      </div>

      {/* Profile card */}
      {employee ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-4 text-muted-foreground" aria-hidden="true" />
              Profile
            </CardTitle>
            <CardDescription>Employee details</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid w-full max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{employee.email}</dd>
              <dt className="text-muted-foreground">Department</dt>
              <dd>{employee.department ?? "—"}</dd>
              <dt className="text-muted-foreground">Added</dt>
              <dd>{formatDate(employee.createdAt.slice(0, 10))}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={employee.isActive ? "success" : "muted"}>
                  {employee.isActive ? "Active" : "Inactive"}
                </Badge>
              </dd>
              <dt className="text-muted-foreground">Actions</dt>
              <dd>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmActive(true)}
                  className="h-7 px-2 text-xs"
                >
                  <UserRoundX aria-hidden="true" />
                  {employee.isActive ? "Deactivate" : "Activate"}
                </Button>
              </dd>
            </dl>
          </CardContent>
        </Card>
      ) : (
        <Skeleton className="h-40 w-full" />
      )}

      {/* Range stats */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Attendance history</h2>
            <p className="text-sm text-muted-foreground">
              {range.from ? formatDate(range.from) : "—"} – {range.to ? formatDate(range.to) : "—"}
            </p>
          </div>
          <DateRangePicker value={range} onChange={setRange} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label="Days present" value={String(report?.daysPresent ?? 0)} isLoading={reportPending} />
          <StatTile label="Days absent" value={String(report?.daysAbsent ?? 0)} isLoading={reportPending} />
          <StatTile
            label="Total hours"
            value={formatDuration(report?.totalMinutes)}
            isLoading={reportPending}
          />
          <StatTile
            label="Avg per day"
            value={formatDuration(report?.averageMinutesPerDay)}
            isLoading={reportPending}
          />
          <StatTile
            label="Forgotten check-outs"
            value={String(report?.forgottenCheckOuts ?? 0)}
            isLoading={reportPending}
          />
        </div>

        {reportPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : !report || report.records.length === 0 ? (
          <EmptyState
            icon={Download}
            title="No attendance in this range"
            description="No records were found for the selected dates."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Worked</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.records.map((record) => {
                const mapsUrl = mapLink(record.latitude, record.longitude);

                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                    <TableCell>{formatTime(record.checkIn)}</TableCell>
                    <TableCell>
                      {record.checkOut ? (
                        formatTime(record.checkOut)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDuration(record.workedMinutes ?? null)}</TableCell>
                    <TableCell>
                      {mapsUrl ? (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-info-foreground underline-offset-4 hover:underline"
                          title={`${record.latitude}, ${record.longitude}`}
                        >
                          <MapPin className="size-4" aria-hidden="true" />
                          <span className="sr-only">Open location in Google Maps</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={getAttendanceStatus(
                          employee ?? { isActive: true },
                          record,
                          today,
                        )}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit employee</DialogTitle>
            <DialogDescription>{employee?.email}</DialogDescription>
          </DialogHeader>
          {employee ? (
            <>
              <EditEmployeeForm
                key={employee.id}
                employee={employee}
                onSubmit={handleEditSubmit}
                isSubmitting={updateEmployee.isPending}
                apiError={apiErrorMessage(updateEmployee.error)}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" form="edit-employee-form" isLoading={updateEmployee.isPending}>
                  Save changes
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Activate / deactivate confirmation */}
      <ConfirmDialog
        open={confirmActive}
        title={employee?.isActive ? "Deactivate employee" : "Activate employee"}
        description={
          employee?.isActive
            ? `${employee.name} will no longer be able to sign in or check in. Their data is kept.`
            : `${employee?.name ?? "This employee"} will be able to sign in again.`
        }
        confirmLabel={employee?.isActive ? "Deactivate" : "Activate"}
        destructive={employee?.isActive === true}
        isConfirming={setActive.isPending}
        onOpenChange={setConfirmActive}
        onConfirm={handleToggleActive}
      />

      <TemporaryPasswordDialog
        password={tempPassword}
        title="New temporary password"
        description="Share this password with the employee."
        onClose={() => setTempPassword(null)}
      />
    </div>
  );
}
