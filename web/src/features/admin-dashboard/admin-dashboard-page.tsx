"use client";

import { formatDistanceToNow, parseISO } from "date-fns";
import {
  Inbox,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { useAdminActivity, useAdminStats, useAdminTrends } from "@/features/admin-dashboard/use-admin";
import {
  useAdminEmployers,
  useApproveEmployer,
  useRejectEmployer,
} from "@/features/employers/use-employers";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { EmptyState } from "@/shared/components/empty-state";
import { QueryErrorAlert } from "@/shared/components/query-error-alert";
import { apiErrorMessage } from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/ui/chart";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import type { AdminActivityType as AdminActivityEventType } from "@/features/admin-dashboard/admin.service";

const chartConfig = {
  count: { label: "Count" },
} satisfies ChartConfig;

function StatCards() {
  const stats = useAdminStats();

  if (stats.isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (stats.isError) {
    return (
      <QueryErrorAlert
        title="Failed to load platform stats"
        error={stats.error}
        onRetry={() => void stats.refetch()}
        isRetrying={stats.isRefetching}
      />
    );
  }

  const data = stats.data;
  const cards = [
    { title: "Pending approvals", value: data?.employers.pending ?? 0, href: "/admin/employers?tab=pending" },
    { title: "Approved employers", value: data?.employers.approved ?? 0, href: "/admin/employers?tab=approved" },
    { title: "Rejected requests", value: data?.employers.rejected ?? 0, href: "/admin/employers?tab=rejected" },
    { title: "Check-ins today", value: data?.checkInsToday ?? 0, href: null },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const isPendingApprovals = card.title === "Pending approvals";
        const content = (
          <>
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <div className="mt-2 flex items-end justify-between gap-2">
              <span className="text-2xl font-semibold tracking-tight">{card.value}</span>
              {card.href ? (
                <Badge variant={isPendingApprovals && card.value > 0 ? "warning" : "muted"}>
                  Review
                </Badge>
              ) : null}
            </div>
          </>
        );

        return card.href ? (
          <Link key={card.title} href={card.href}>
            <Card className="h-full transition-colors hover:border-primary/40 hover:bg-accent/40">
              <CardContent className="p-5">{content}</CardContent>
            </Card>
          </Link>
        ) : (
          <Card key={card.title} className="h-full">
            <CardContent className="p-5">{content}</CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function TrendToggle({ value, onChange }: { value: 7 | 30; onChange: (days: 7 | 30) => void }) {
  return (
    <div
      role="group"
      aria-label="Trend period"
      className="inline-flex rounded-md border border-border p-0.5 text-xs"
    >
      {([7, 30] as const).map((days) => (
        <button
          key={days}
          type="button"
          onClick={() => onChange(days)}
          aria-pressed={value === days}
          className={cn(
            "rounded px-2.5 py-1 font-medium transition-colors",
            value === days
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {days}d
        </button>
      ))}
    </div>
  );
}

function TrendChart({
  title,
  entries,
}: {
  title: string;
  entries: { date: string; count: number }[];
}) {
  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>Latest {entries.length} days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-40 w-full">
          <AreaChart data={entries} margin={{ left: -20, right: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: string | number) => formatDate(String(value))}
            />
            <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
            <ChartTooltip
              content={<ChartTooltipContent labelFormatter={(label: string | number) => formatDate(String(label))} />}
            />
            <Area dataKey="count" type="monotone" fill="var(--primary)" fillOpacity={0.15} stroke="var(--primary)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function TrendCharts() {
  const [trendDays, setTrendDays] = useState<7 | 30>(7);
  const trends = useAdminTrends(trendDays);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Last {trendDays} days</h2>
        <TrendToggle value={trendDays} onChange={setTrendDays} />
      </div>
      {trends.isPending ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : trends.isError ? (
        <QueryErrorAlert
          title="Failed to load trends"
          error={trends.error}
          onRetry={() => void trends.refetch()}
          isRetrying={trends.isRefetching}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <TrendChart title="Employer registrations" entries={trends.data.registrations} />
          <TrendChart title="Platform check-ins" entries={trends.data.checkIns} />
        </div>
      )}
    </section>
  );
}

function PendingApprovals() {
  const pending = useAdminEmployers({ status: "PENDING", page: 1, limit: 5 });
  const approve = useApproveEmployer();
  const reject = useRejectEmployer();
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  function handleApprove(id: string) {
    approve.mutate(id, {
      onSuccess: () => toast.success("Employer approved"),
      onError: (error) => toast.error(apiErrorMessage(error)),
    });
  }

  function handleReject() {
    if (!rejectTarget) {
      return;
    }
    reject.mutate(
      { id: rejectTarget.id, reason: rejectReason },
      {
        onSuccess: () => toast.success("Employer rejected"),
        onError: (error) => toast.error(apiErrorMessage(error)),
        onSettled: () => {
          setRejectTarget(null);
          setRejectReason("");
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle className="text-base">Pending approvals</CardTitle>
          <CardDescription>New employer requests waiting for review</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/employers?tab=pending">View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {pending.isPending ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : pending.isError ? (
          <QueryErrorAlert
            title="Failed to load pending requests"
            error={pending.error}
            onRetry={() => void pending.refetch()}
            isRetrying={pending.isRefetching}
          />
        ) : pending.data.items.length === 0 ? (
          <EmptyState icon={Inbox} title="No pending requests" description="All caught up." />
        ) : (
          pending.data.items.map((employer) => (
            <div
              key={employer.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{employer.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {employer.company || employer.email}
                </p>
              </div>
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                {formatDate(employer.createdAt.slice(0, 10))}
              </span>
              <div className="flex shrink-0 gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={approve.isPending}
                  onClick={() => handleApprove(employer.id)}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={reject.isPending}
                  onClick={() => setRejectTarget({ id: employer.id, name: employer.name })}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <ConfirmDialog
        open={rejectTarget !== null}
        title="Reject employer"
        description={
          rejectTarget
            ? `${rejectTarget.name} will not be able to sign in. You can optionally add a reason shown to them at login.`
            : ""
        }
        confirmLabel="Reject"
        destructive
        isConfirming={reject.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
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
    </Card>
  );
}

const activityMeta: Record<
  AdminActivityEventType,
  { label: string; icon: ReactNode; iconClass: string }
> = {
  EMPLOYER_REGISTERED: { label: "New registration", icon: <UserPlus />, iconClass: "text-info bg-info-soft" },
  EMPLOYER_APPROVED: { label: "Employer approved", icon: <UserCheck />, iconClass: "text-success bg-success-soft" },
  EMPLOYER_REJECTED: { label: "Employer rejected", icon: <UserX />, iconClass: "text-status-red-fg bg-status-red-bg" },
};

function ActivityFeed() {
  const activity = useAdminActivity(10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
        <CardDescription>Latest employer sign-ups and review decisions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {activity.isPending ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : activity.isError ? (
          <QueryErrorAlert
            title="Failed to load activity"
            error={activity.error}
            onRetry={() => void activity.refetch()}
            isRetrying={activity.isRefetching}
          />
        ) : activity.data?.length ? (
          <ul className="divide-y divide-border">
            {activity.data.map((event) => {
              const meta = activityMeta[event.type];
              return (
                <li key={`${event.employerId}-${event.at}`} className="flex items-center gap-3 py-2.5">
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", meta.iconClass)}>
                    {meta.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <span className="font-medium">{event.employerName}</span>
                      {event.company ? <span className="text-muted-foreground"> — {event.company}</span> : null}
                    </p>
                    <p className="text-xs text-muted-foreground">{meta.label}</p>
                  </div>
                  <time
                    dateTime={event.at}
                    title={formatDate(event.at.slice(0, 10))}
                    className="shrink-0 text-xs text-muted-foreground"
                  >
                    {formatDistanceToNow(parseISO(event.at), { addSuffix: true })}
                  </time>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState icon={Inbox} title="No activity yet" />
        )}
      </CardContent>
    </Card>
  );
}

export function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform overview and pending employer requests.</p>
      </div>

      <StatCards />
      <TrendCharts />

      <div className="grid gap-4 lg:grid-cols-2">
        <PendingApprovals />
        <ActivityFeed />
      </div>
    </div>
  );
}
