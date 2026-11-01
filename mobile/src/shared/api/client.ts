import { ApiError } from "@/shared/api/errors";
import { env } from "@/shared/lib/env";
import {
  clearTokens,
  getAccessTokenSync,
  getRefreshToken,
  saveTokens,
} from "@/shared/lib/token-storage";
import type { ApiEnvelope, ApiSuccess, AuthTokens } from "@/shared/types";

const REQUEST_TIMEOUT_MS = 15_000;

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

type QueryValue = string | number | boolean | null | undefined;

export type RequestConfig = {
  path: string;
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** Requests that must not send (or refresh) the bearer token. */
  auth?: boolean /** defaults to true */;
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

class TimeoutError extends Error {
  constructor() {
    super("Request timed out");
    this.name = "TimeoutError";
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
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
      REQUEST_TIMEOUT_MS,
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
  let attempt = 0;

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
        REQUEST_TIMEOUT_MS,
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError("The connection timed out. Please check your network and try again.");
      }
      // Network failures surface as TypeError in React Native.
      throw error instanceof Error ? error : ApiErrorNetwork();
    }

    if (response.status === 401 && shouldAuth && attempt === 0) {
      const fresh = await handleExpiredSession();
      if (fresh) {
        attempt += 1;
        continue;
      }
      throw new ApiError("Your session has expired. Please sign in again.", 401);
    }

    if (!response.ok) {
      const envelope = await parseJson(response);
      const message = envelope && !envelope.success && envelope.message
        ? envelope.message
        : "Something went wrong. Please try again.";
      throw new ApiError(message, response.status);
    }

    const envelope = (await parseJson(response)) as ApiEnvelope<TData> | null;
    if (!envelope || !envelope.success) {
      throw new ApiError(
        envelope && "message" in envelope && envelope.message
          ? envelope.message
          : "Unexpected server response.",
        response.status,
      );
    }

    return envelope;
  }
}

function ApiErrorNetwork(): ApiError {
  return new ApiError("No connection. Check your internet and try again.");
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
