"use client";

import type { AxiosResponse } from "axios";
import { api } from "@/shared/lib/api";
import { ATTENDANCE_API } from "@/shared/lib/endpoints";
import { ApiError } from "@/shared/types/api";

export type ExportParams = Record<string, string | undefined>;

// Backend export endpoints (source of truth: the shared API constants file),
// mounted under /api/attendance as used by the shared axios client, whose
// "/api" base URL is proxied to the backend by Next.
export type ExportEndpoint =
  | typeof ATTENDANCE_API.attendanceExport
  | typeof ATTENDANCE_API.monthlyReportExport;

const FALLBACK_FILENAMES: Record<ExportEndpoint, string> = {
  "attendance/export": "attendance-export",
  "attendance/reports/monthly/export": "attendance-monthly-report",
};

// Downloads an attendance export through the same authenticated axios client
// every dashboard request uses (Authorization header + 401 refresh handling),
// then hands the blob to the browser as a file. The filename keeps the one
// from the backend's Content-Disposition when present.
export async function downloadExport(
  endpoint: ExportEndpoint,
  params: ExportParams,
): Promise<void> {
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query[key] = value;
    }
  }

  let response: AxiosResponse<Blob>;
  try {
    response = await api.get<Blob>(`/${endpoint}`, {
      params: query,
      responseType: "blob",
    });
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError(0, "Something went wrong");
  }

  const dispositionHeader = response.headers["content-disposition"];
  const disposition = Array.isArray(dispositionHeader)
    ? dispositionHeader[0]
    : (dispositionHeader ?? "");
  const basename = /filename="([^"]+)"/.exec(disposition)?.[1];
  const extension = query.format === "xlsx" ? "xlsx" : "csv";
  const filename = basename ?? `${FALLBACK_FILENAMES[endpoint]}.${extension}`;

  const blob = response.data;
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
}
