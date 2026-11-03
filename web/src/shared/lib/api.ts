import axios, { AxiosError, AxiosHeaders, type AxiosRequestConfig } from "axios";
import { z } from "zod";
import { env } from "../config/env";
import { ApiError, type ApiEnvelope, type ApiErrorEnvelope, type Paginated } from "../types/api";

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
});

// The base URL is "/api": request urls passed here must NOT already include
// the prefix or axios would produce "/api/api/..." which the backend answers
// with a 404 "Route not found".
const BASE_URL_HAS_API_PREFIX = env.NEXT_PUBLIC_API_BASE_URL
  .replace(/\/+$/, "")
  .toLowerCase()
  .endsWith("/api");

function stripDoubledApiPrefix(url: string): string {
  if (!BASE_URL_HAS_API_PREFIX) {
    return url;
  }

  const rest = url.replace(/^\/+/, "");
  if (rest.startsWith("api/") || rest === "api") {
    const remainder = rest.slice(3);
    if (remainder.length === 0) {
      return "/";
    }
    return remainder.startsWith("/") ? remainder : `/${remainder}`;
  }

  return url;
}

type AuthBridge = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokensRefreshed: (tokens: { accessToken: string; refreshToken: string }) => void;
  onAuthFailure: () => void;
};

let authBridge: AuthBridge | null = null;
let refreshPromise: Promise<void> | null = null;

export function configureApi(bridge: AuthBridge): void {
  authBridge = bridge;
}

api.interceptors.request.use((config) => {
  if (typeof config.url === "string" && !/^https?:\/\//i.test(config.url)) {
    config.url = stripDoubledApiPrefix(config.url);
  }

  const accessToken = authBridge?.getAccessToken();

  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

function isAuthEndpoint(url?: string): boolean {
  return !!url && (url.includes("/users/login") || url.includes("/users/refresh"));
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      original &&
      !original._retry &&
      authBridge &&
      !isAuthEndpoint(original.url) &&
      authBridge.getRefreshToken()
    ) {
      if (!refreshPromise) {
        refreshPromise = api
          .post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>("/users/refresh", {
            refreshToken: authBridge.getRefreshToken(),
          })
          .then(({ data }) => {
            authBridge?.onTokensRefreshed(data.data);
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      try {
        await refreshPromise;
        original._retry = true;
        const headers = new AxiosHeaders(original.headers as unknown as Record<string, string>);
        headers.set("Authorization", `Bearer ${authBridge.getAccessToken()}`);
        original.headers = headers;
        return api.request(original);
      } catch {
        authBridge.onAuthFailure();
      }
    }

    const message = await apiErrorMessageFromData(error.response?.data, status);

    return Promise.reject(new ApiError(status ?? 0, message));
  },
);

// With blob responses (file downloads) the error body arrives as a Blob, so
// the API message must be parsed back out of it for toasts to show the real
// reason (e.g. the 429 rate-limit text forwarded by the backend).
async function apiErrorMessageFromData(data: unknown, status: number | undefined): Promise<string> {
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text()) as ApiErrorEnvelope;
      if (parsed.message) {
        return parsed.message;
      }
    } catch {
      // Blob was not JSON; fall back to the generic message.
    }
  }

  return (data as ApiErrorEnvelope | undefined)?.message ??
    (status === undefined ? "Cannot reach the server" : "Something went wrong");
}

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<ApiEnvelope<T>>(config);
  return response.data.data;
}

// Shape guard for every paginated list the backend returns:
// { success: true, data: { items, page, limit, total, totalPages } }. Parsing
// here (instead of trusting the network) keeps list pages consistent; items
// are validated per feature at the call site.
const paginatedEnvelopeSchema = z.object({
  items: z.array(z.unknown()),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

export function parsePaginated<T>(
  data: unknown,
  context: string,
  parseItem: (item: unknown) => T,
): Paginated<T> {
  const parsed = paginatedEnvelopeSchema.safeParse(data);

  if (!parsed.success) {
    throw new ApiError(
      0,
      `Invalid ${context} response: expected an items array with page, limit, total and totalPages.`,
    );
  }

  return {
    items: parsed.data.items.map((item) => parseItem(item)),
    total: parsed.data.total,
    page: parsed.data.page,
    limit: parsed.data.limit,
    totalPages: parsed.data.totalPages,
  };
}

// Human-readable message for any thrown error (network, HTTP, or unknown).
export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorEnvelope | undefined;
    return (data?.message ?? error.message) || "Something went wrong";
  }
  return error instanceof Error && error.message
    ? error.message
    : "Something went wrong";
}
