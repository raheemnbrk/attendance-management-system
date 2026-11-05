"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";
import { useAuthStore } from "@/features/auth/auth.store";
import { useEntryQr } from "@/features/attendance/use-attendance";
import { QueryErrorAlert } from "@/shared/components/query-error-alert";
import { Skeleton } from "@/shared/ui/skeleton";

// Entrance QR display: meant to stay open on a screen at the door. The token
// lives 30s server-side; the dashboard mints a new one every ~25s (paused
// while the tab is hidden, refreshed immediately when it comes back) and the
// ring shows how much time is left before the refresh.
const REFRESH_HEADROOM_MS = 2_000;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function EntryQrPage() {
  const user = useAuthStore((state) => state.user);
  const { data, error, isError, isFetching, isLoading, refetch } = useEntryQr();

  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Safety net beyond the fixed refetchInterval: if the token is about to
  // expire while visible (slow dashboard load, throttled timer...), mint a new
  // one right away.
  useEffect(() => {
    if (!data || isFetching) {
      return;
    }
    if (typeof document !== "undefined" && document.hidden) {
      return;
    }
    if (Date.parse(data.expiresAt) - nowMs <= REFRESH_HEADROOM_MS) {
      void refetch();
    }
  }, [data, isFetching, nowMs, refetch]);

  const expiresAtMs = data ? Date.parse(data.expiresAt) : Number.NaN;
  const remainingMs = Number.isNaN(expiresAtMs) ? 0 : Math.max(0, expiresAtMs - nowMs);
  const ttlMs = data ? data.ttlSeconds * 1000 : 30_000;
  const ratio = data ? clamp01(remainingMs / ttlMs) : 0;
  const secondsLeft = Math.ceil(remainingMs / 1000);

  const title = user?.company?.trim() || user?.name || "Attendance";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Entry QR</h1>
        <p className="text-sm text-muted-foreground">
          Show this code at the entrance. Employees scan it to check in and check out.
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 pb-6">
        {isLoading ? (
          <Skeleton className="aspect-square w-[min(80vmin,520px)] rounded-3xl" />
        ) : isError ? (
          <div className="w-full max-w-xl">
            <QueryErrorAlert
              title="Could not load the entry code"
              error={error}
              onRetry={() => void refetch()}
              isRetrying={isFetching}
            />
          </div>
        ) : data ? (
          <>
            <div
              className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-card px-8 py-8 shadow-sm"
              style={{ width: "min(80vmin, 520px)" }}
            >
              <p className="truncate text-center text-xl font-semibold tracking-tight">
                {title}
              </p>

              {/* QR codes need a light, high-contrast background to scan, so
                  the canvas itself stays white in every theme. */}
              <div className="rounded-2xl bg-white p-5">
                <QRCodeSVG
                  value={data.token}
                  size={512}
                  level="M"
                  style={{ display: "block", height: "auto", width: "100%" }}
                />
              </div>

              <CountdownRing
                ratio={ratio}
                secondsLeft={secondsLeft}
                isRefreshing={isFetching && remainingMs <= 0}
              />

              <p className="flex items-center gap-2 text-center text-xs text-muted-foreground">
                <QrCode className="size-4 shrink-0" aria-hidden="true" />
                {isFetching && remainingMs <= 0 ? "Refreshing the code…" : "New code every 30 seconds"}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function CountdownRing({
  ratio,
  secondsLeft,
  isRefreshing,
}: {
  ratio: number;
  secondsLeft: number;
  isRefreshing: boolean;
}) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative grid h-16 w-16 place-items-center" aria-live="polite">
      <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="5"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
        />
      </svg>
      <span className="text-sm font-semibold tabular-nums">{isRefreshing ? "…" : secondsLeft}</span>
    </div>
  );
}
