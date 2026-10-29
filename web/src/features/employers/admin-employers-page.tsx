"use client";

import { Inbox, ShieldAlert, UserRoundSearch } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useAdminEmployers,
  useApproveEmployer,
  useRejectEmployer,
  useSetEmployerSuspended,
} from "./use-employers";
import type { EmployerStatus } from "./employers.service";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { EmptyState } from "@/shared/components/empty-state";
import { TablePagination } from "@/shared/components/table-pagination";
import { apiErrorMessage } from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/format";
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
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

const PAGE_SIZE = 10;

const STATUS_TABS: { value: EmployerStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function statusBadge(
  status: string,
): { variant: "warning" | "success" | "destructive"; label: string } {
  if (status === "PENDING") {
    return { variant: "warning", label: "Pending" };
  }
  if (status === "APPROVED") {
    return { variant: "success", label: "Approved" };
  }
  return { variant: "destructive", label: "Rejected" };
}

export function AdminEmployersPage() {
  // ?tab= selects the starting tab (client-only, same pattern as other pages).
  const [status, setStatus] = useState<EmployerStatus>("PENDING");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [suspendTarget, setSuspendTarget] = useState<{
    id: string;
    name: string;
    activating: boolean;
  } | null>(null);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "pending" || tab === "approved" || tab === "rejected") {
      setStatus(tab.toUpperCase() as EmployerStatus);
    }
  }, []);

  // Debounce: only query once typing pauses for 300ms.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const employers = useAdminEmployers({ status, search, page, limit: PAGE_SIZE });
  const approve = useApproveEmployer();
  const reject = useRejectEmployer();
  const setSuspended = useSetEmployerSuspended();

  function changeTab(next: string) {
    const tab = next as EmployerStatus;
    setStatus(tab);
    setPage(1);
    window.history.replaceState(null, "", `/admin/employers?tab=${tab.toLowerCase()}`);
  }

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

  function handleToggleActive() {
    if (!suspendTarget) {
      return;
    }
    setSuspended.mutate(
      { id: suspendTarget.id, isActive: suspendTarget.activating },
      {
        onSuccess: () =>
          toast.success(suspendTarget.activating ? "Employer reactivated" : "Employer suspended"),
        onError: (error) => toast.error(apiErrorMessage(error)),
        onSettled: () => setSuspendTarget(null),
      },
    );
  }

  const rows = useMemo(() => employers.data?.items ?? [], [employers.data]);
  const totalPages = employers.data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Employers</h1>
        <p className="text-sm text-muted-foreground">
          Review sign-up requests and manage employer access.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Employer accounts</CardTitle>
            <CardDescription>
              {employers.isLoading
                ? "Loading employers…"
                : `${employers.data?.total ?? 0} ${status.toLowerCase()} employer${(employers.data?.total ?? 0) === 1 ? "" : "s"}`}
            </CardDescription>
          </div>
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name, email or company"
            className="max-w-xs"
            aria-label="Search employers"
          />
        </CardHeader>
        <div className="px-6 pb-4">
          <Tabs value={status} onValueChange={changeTab}>
            <TabsList aria-label="Employer status">
              {STATUS_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <CardContent>
          {employers.isError ? (
            <Alert variant="destructive">
              <ShieldAlert aria-hidden="true" />
              <AlertTitle>Failed to load employers</AlertTitle>
              <AlertDescription>{apiErrorMessage(employers.error)}</AlertDescription>
            </Alert>
          ) : employers.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={search.trim() ? UserRoundSearch : Inbox}
              title={search.trim() ? "No matches" : "Nothing here"}
              description={
                search.trim()
                  ? "No employers match your search."
                  : status === "PENDING"
                    ? "All sign-up requests were reviewed."
                    : status === "APPROVED"
                      ? "No approved employers yet."
                      : "No rejected requests."
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employer</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Registered</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((employer) => {
                    const badge = statusBadge(employer.status);
                    return (
                      <TableRow key={employer.id}>
                        <TableCell>
                          <Link
                            href={`/admin/employers/${employer.id}`}
                            className="font-medium underline-offset-4 hover:underline"
                          >
                            {employer.name}
                          </Link>
                          {employer.company ? (
                            <p className="text-xs text-muted-foreground">{employer.company}</p>
                          ) : null}
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {employer.email}
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                          {formatDate(employer.createdAt.slice(0, 10))}
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {employer.status === "PENDING" ? (
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={approve.isPending || reject.isPending}
                                onClick={() => handleApprove(employer.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={approve.isPending || reject.isPending}
                                onClick={() =>
                                  setRejectTarget({ id: employer.id, name: employer.name })
                                }
                              >
                                Reject
                              </Button>
                            </div>
                          ) : employer.status === "APPROVED" ? (
                            <Button
                              size="sm"
                              variant={employer.isActive ? "outline" : "default"}
                              disabled={setSuspended.isPending}
                              onClick={() =>
                                setSuspendTarget({
                                  id: employer.id,
                                  name: employer.name,
                                  activating: !employer.isActive,
                                })
                              }
                            >
                              {employer.isActive ? "Suspend" : "Reactivate"}
                            </Button>
                          ) : null}
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

      <ConfirmDialog
        open={suspendTarget !== null}
        title={suspendTarget?.activating ? "Reactivate employer" : "Suspend employer"}
        description={
          suspendTarget
            ? suspendTarget.activating
              ? `${suspendTarget.name} will regain access, including their employee accounts.`
              : `${suspendTarget.name}'s account and all employee accounts will be disabled immediately; open sessions are revoked. You can reactivate at any time.`
            : ""
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
