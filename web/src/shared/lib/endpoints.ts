// The single API constants file for the attendance feature: every URL the web
// app sends goes through here so frontend paths can be checked against the
// backend mounts in one place (backend/src/shared/app.ts mounts the routers at
// /api/users and /api/attendance). The axios client's baseURL already supplies
// the "/api" prefix, so these paths never repeat it.
export const ATTENDANCE_API = {
  // Entrance QR display (employer only).
  entryQr: "/attendance/entry-qr",
  summary: "/attendance/summary",
  trend: "/attendance/trend",
  employerAttendance: "/attendance/employees",
  employeeReport: (employeeId: string) => `/attendance/reports/employee/${employeeId}`,
  monthlyReport: "/attendance/reports/monthly",
  // Export paths intentionally omit the leading slash: the download helper
  // prefixes them itself ("/" + endpoint).
  monthlyReportExport: "attendance/reports/monthly/export",
  attendanceExport: "attendance/export",
} as const;
