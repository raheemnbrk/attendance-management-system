"use client";

import { env } from "@/shared/config/env";
import { useAuthStore } from "@/features/auth/auth.store";
import { ApiError } from "@/shared/types/api";

export type ExportParams = Record<string, string | undefined>;

// Downloads an attendance export through the Next.js proxy route handler
// (app/api/export/route.ts), preserving the backend filename from
// Content-Disposition and surfacing API errors (including 429 messages).
export async function downloadExport(
  endpoint: "export" | "reports/monthly/export",
  params: ExportParams,
): Promise<void> {
  const accessToken = useAuthStore.getState().accessToken;
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }

  const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/${endpoint}?${search}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok || contentType.includes("application/json")) {
    let message = `Export failed (${response.status})`;

    try {
      const data = (await response.json()) as { message?: string };
      if (data.message) {
        message = data.message;
      }
    } catch {
      // Response was not JSON; keep the fallback message.
    }

    throw new ApiError(response.status, message);
  }

  const disposition = response.headers.get("content-disposition") ?? "";
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? "attendance-export";
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
