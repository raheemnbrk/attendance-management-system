"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  BarChart3,
  LogOut,
  Plus,
  UserCheck,
  UserRound,
  UserRoundX,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Area,
  AreaChart,
  XAxis,
} from "recharts";
import { useEmployees } from "@/features/employees/use-employees";
import { getAttendanceStatus } from "@/features/attendance/attendance.types";
import { useAttendanceSummary, useEmployerAttendance, useTrend } from "@/features/attendance/use-attendance";
import { isRestDayISO } from "@/shared/lib/business";
import { StatusBadge } from "@/shared/components/status-badge";
import { todayLocalISO } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/ui/chart";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

const trendConfig = {
  present: { label: "Present", color: "var(--primary)" },
  absent: { label: "Absent", color: "var(--destructive)" },
} as const;

function SummaryCard({
  title,
  value,
  icon: Icon,
  isLoading,
}: {
  title: string;
  value: number | undefined;
  icon: typeof Users;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <p className="text-2xl font-semibold tabular-nums">{value ?? 0}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const today = todayLocalISO();
  // Rest days (Friday, Saturday) are never shown as absences.
  const todayIsRestDay = isRestDayISO(today);
  const [trendDays, setTrendDays] = useState(7);

  const { data: summary, isPending: summaryPending } = useAttendanceSummary();
  const { data: trend, isPending: trendPending } = useTrend(trendDays);
  const { data: attendanceToday, isPending: todayPending } = useEmployerAttendance({
    date: today,
    limit: 100,
  });
  const { data: employees, isPending: employeesPending } = useEmployees();

  const todayRows = useMemo(() => {
    if (!employees) {
      return [];
    }

    const recordsByUserId = new Map(
      (attendanceToday?.items ?? []).map((record) => [record.userId, record]),
    );

    return employees
      .map((employee) => ({
        employee,
        record: recordsByUserId.get(employee.id),
        status: getAttendanceStatus(employee, recordsByUserId.get(employee.id), today, todayIsRestDay),
      }))
      .sort((a, b) => {
        const rank = { present: 0, working: 1, "forgot-check-out": 2, absent: 3, rest: 4, inactive: 5 } as const;
        if (rank[a.status] !== rank[b.status]) {
          return rank[a.status] - rank[b.status];
        }
        if (a.record && b.record) {
          return a.record.checkIn.localeCompare(b.record.checkIn);
        }
        return a.employee.name.localeCompare(b.employee.name);
      });
  }, [employees, attendanceToday, today, todayIsRestDay]);

  const isLoading = summaryPending || trendPending || todayPending || employeesPending;
  const isEmpty = !summaryPending && summary?.totalEmployees === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <Users className="size-10 text-muted-foreground" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-semibold">Add your first employee</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Once you have employees, attendance and reports will show up here.
          </p>
        </div>
        <Button asChild>
          <Link href="/employer/employees?new=1">
            <Plus aria-hidden="true" />
            Add employee
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {summary ? format(`${summary.date}T00:00:00`, "EEEE, PP") : "Today"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/employer/attendance">
              <BarChart3 aria-hidden="true" />
              View attendance
            </Link>
          </Button>
          <Button asChild>
            <Link href="/employer/employees?new=1">
              <Plus aria-hidden="true" />
              Add employee
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total employees"
          value={summary?.totalEmployees}
          icon={Users}
          isLoading={summaryPending}
        />
        <SummaryCard
          title="Present"
          value={summary?.present}
          icon={UserCheck}
          isLoading={summaryPending}
        />
        <SummaryCard
          title="Absent"
          value={summary?.absent}
          icon={UserRoundX}
          isLoading={summaryPending}
        />
        <SummaryCard
          title="Checked out"
          value={summary?.checkedOut}
          icon={LogOut}
          isLoading={summaryPending}
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Attendance trend</CardTitle>
            <CardDescription>Present and absent employees per day</CardDescription>
          </div>
          <div className="inline-flex rounded-md border border-input p-0.5">
            {[7, 30].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTrendDays(option)}
                className={cn(
                  "rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                  trendDays === option
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={trendDays === option}
              >
                {option}d
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {trendPending ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ChartContainer config={trendConfig} className="h-64 w-full aspect-auto">
              <AreaChart data={trend ?? []} margin={{ left: 4, right: 4 }}>
                <defs>
                  <linearGradient id="fillPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-present)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-present)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-absent)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-absent)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value: string) => format(`${value}T00:00:00`, "MMM d")}
                  minTickGap={24}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent labelFormatter={(label) => format(`${label}T00:00:00`, "PP")} />}
                />
                <Area
                  dataKey="present"
                  type="monotone"
                  stackId="1"
                  stroke="var(--color-present)"
                  fill="url(#fillPresent)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="absent"
                  type="monotone"
                  stackId="1"
                  stroke="var(--color-absent)"
                  fill="url(#fillAbsent)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today</CardTitle>
          <CardDescription>Who checked in today</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : todayRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No employees yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayRows.map((row) => (
                  <TableRow key={row.employee.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <UserRound className="size-4 text-muted-foreground" aria-hidden="true" />
                        {row.employee.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      {row.record
                        ? format(`${row.record.checkIn}`, "h:mm a")
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
