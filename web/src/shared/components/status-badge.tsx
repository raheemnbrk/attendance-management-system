"use client";

import { Badge } from "@/shared/ui/badge";
import type { AttendanceStatus } from "@/features/attendance/attendance.types";

// Present = success, Forgot check-out = warning, Absent = soft status red,
// Inactive = muted. Working (open day, no check-out yet) = info. All status
// badges share the soft background + colored text + subtle border pattern.
const STATUS_META: Record<AttendanceStatus, { label: string; variant: "success" | "warning" | "destructive" | "muted" | "info" }> = {
  present: { label: "Present", variant: "success" },
  "forgot-check-out": { label: "Forgot check-out", variant: "warning" },
  working: { label: "Working", variant: "info" },
  absent: { label: "Absent", variant: "destructive" },
  inactive: { label: "Inactive", variant: "muted" },
};

export function StatusBadge({ status }: { status: AttendanceStatus }) {
  const meta = STATUS_META[status];

  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
