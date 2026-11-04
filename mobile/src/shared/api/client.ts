import {
  ApiError,
  SERVER_ERROR_MESSAGE,
  TIMEOUT_ERROR_MESSAGE,
} from "@/shared/api/errors";
import { env } from "@/shared/lib/env";
import {
  clearTokens,
  getAccessTokenSync,
  getRefreshToken,
  saveTokens,
} from "@/shared/lib/token-storage";
import type { ApiEnvelope, ApiSuccess, AuthTokens } from "@/shared/types";

export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;
export const LOGIN_REQUEST_TIMEOUT_MS = 60_000;

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

type QueryValue = string | number | boolean | null | undefined;

export type RequestConfig = {
  path: string;
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** Requests that must not send (or refresh) the bearer token; defaults to true. */
  auth?: boolean;
  /** Overrides the default request timeout, e.g. login waits 60s for cold starts. */
  timeoutMs?: number;
  /** Extra attempts for transient failures (network drop / timeout), e.g.
   * login survives a dropped connection during a Render cold start. Only set
   * this for requests that are safe to repeat. */
  retries?: number;
  /** Excludes the request from the expired-session flow: a 401 neither
   * triggers a token refresh nor a forced logout. Required for the auth
   * endpoints themselves (login), which never own a valid token yet. */
  skipAuthRefresh?: boolean;
};

type AuthEventHandler = {
  /** Called with the fresh token pair right after a successful refresh. */
  onTokensRefreshed?: (tokens: AuthTokens) => void | Promise<void>;
  /** Called when the session can no longer be restored (refresh failed). */
  onUnauthorized?: () => void;
};

let authEventHandler: AuthEventHandler = {};

/** Registered by the root providers so the client can persist refreshed
 * tokens and perform a logout redirect without importing features. */
export function setAuthEventHandler(handler: AuthEventHandler): void {
  authEventHandler = handler;
}

// ---------------------------------------------------------------------------
// Low level helpers
// ---------------------------------------------------------------------------

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = `${env.apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
}

export class TimeoutError extends Error {
  constructor() {
    super(TIMEOUT_ERROR_MESSAGE);
    this.name = "TimeoutError";
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    // On React Native the abort of an in-flight request can surface as
    // TypeError("Network request failed") instead of AbortError, so the
    // aborted signal itself is the single source of truth for a timeout.
    if (controller.signal.aborted) {
      throw new TimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/** __DEV__-only diagnostics for failed requests. Logs only the method, status
 * code (when known) and a short message. Never logs the URL, headers, tokens
 * or bodies. */
function logFailedRequest(method: string, error: unknown): void {
  if (!__DEV__) {
    return;
  }
  const status = error instanceof ApiError && error.status !== undefined ? ` (status ${error.status})` : "";
  const message = error instanceof Error ? error.message : String(error);
  const short = message.length > 80 ? `${message.slice(0, 80)}…` : message;
  console.log(`[api] ${method} request failed${status} → ${short}`);
}

async function parseJson(response: Response): Promise<ApiEnvelope<unknown> | null> {
  try {
    return (await response.json()) as ApiEnvelope<unknown>;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Token refresh (single flight)
// ---------------------------------------------------------------------------

let refreshInFlight: Promise<AuthTokens | null> | null = null;

function refreshTokens(): Promise<AuthTokens | null> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function performRefresh(): Promise<AuthTokens | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetchWithTimeout(
      buildUrl("/users/refresh"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      },
      DEFAULT_REQUEST_TIMEOUT_MS,
    );

    if (!response.ok) {
      return null;
    }

    const envelope = (await parseJson(response)) as ApiEnvelope<AuthTokens> | null;
    if (!envelope || !envelope.success) {
      return null;
    }

    // Persist before any retried request runs, so concurrent callers all see
    // the same token pair.
    await saveTokens(envelope.data);
    return envelope.data;
  } catch {
    return null;
  }
}

async function handleExpiredSession(): Promise<AuthTokens | null> {
  const fresh = await refreshTokens();
  if (fresh) {
    await authEventHandler.onTokensRefreshed?.(fresh);
    return fresh;
  }

  await clearTokens();
  authEventHandler.onUnauthorized?.();
  return null;
}

// ---------------------------------------------------------------------------
// Public request API
// ---------------------------------------------------------------------------

export async function apiRequest<TData>(config: RequestConfig): Promise<ApiSuccess<TData>> {
  const method = config.method ?? "GET";
  const endpoint = buildUrl(config.path, config.query);
  const shouldAuth = config.auth !== false;
  const timeoutMs = config.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  let reauthenticated = false;
  let retriedNetwork = false;
  let retriesLeft = config.retries ?? 0;

  for (;;) {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    const accessToken = shouldAuth ? getAccessTokenSync() : null;
    if (shouldAuth && accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    let response: Response;
    try {
      response = await fetchWithTimeout(
        endpoint,
        {
          method,
          headers,
          body: config.body === undefined ? undefined : JSON.stringify(config.body),
        },
        timeoutMs,
      );
    } catch (error) {
      logFailedRequest(method, error);
      if (error instanceof TimeoutError) {
        // The single retry covers Render free-tier cold starts, whose very
        // first connection can drop or blow the budget.
        if (retriesLeft > 0) {
          retriesLeft -= 1;
          continue;
        }
        throw new ApiError(TIMEOUT_ERROR_MESSAGE);
      }
      if (method === "GET" && !retriedNetwork && error instanceof TypeError) {
        retriedNetwork = true;
        continue;
      }
      if (error instanceof TypeError && retriesLeft > 0) {
        retriesLeft -= 1;
        continue;
      }
      throw error instanceof Error ? error : new ApiError("Something went wrong. Please try again.");
    }

    if (
      response.status === 401 &&
      shouldAuth &&
      !reauthenticated &&
      // Auth endpoints (login) can also answer 401 (bad credentials) — that is
      // not an expired session, so the refresh flow must not kick in.
      !config.skipAuthRefresh
    ) {
      const fresh = await handleExpiredSession();
      if (fresh) {
        reauthenticated = true;
        continue;
      }
      const sessionError = new ApiError("Your session has expired. Please sign in again.", 401);
      logFailedRequest(method, sessionError);
      throw sessionError;
    }

    if (!response.ok) {
      const envelope = await parseJson(response);
      const message = envelope && !envelope.success && envelope.message
        ? envelope.message
        : "Something went wrong. Please try again.";
      // 5xx responses are server-side; the caller cannot fix "Internal server
      // error", so a single canned message covers the whole 5xx range.
      const apiError = new ApiError(
        response.status >= 500 ? SERVER_ERROR_MESSAGE : message,
        response.status,
      );
      logFailedRequest(method, apiError);
      throw apiError;
    }

    const envelope = (await parseJson(response)) as ApiEnvelope<TData> | null;
    if (!envelope || !envelope.success) {
      const apiError = new ApiError(
        envelope && "message" in envelope && envelope.message
          ? envelope.message
          : "Unexpected server response.",
        response.status,
      );
      logFailedRequest(method, apiError);
      throw apiError;
    }

    return envelope;
  }
}

export function apiGet<TData>(path: string, query?: Record<string, QueryValue>): Promise<ApiSuccess<TData>> {
  return apiRequest<TData>({ path, method: "GET", query });
}

export function apiPost<TData>(path: string, body?: unknown): Promise<ApiSuccess<TData>> {
  return apiRequest<TData>({ path, method: "POST", body });
}

export function apiPatch<TData>(path: string, body?: unknown): Promise<ApiSuccess<TData>> {
  return apiRequest<TData>({ path, method: "PATCH", body });
}
