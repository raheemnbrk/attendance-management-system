import axios, { AxiosError, AxiosHeaders, type AxiosRequestConfig } from "axios";
import { env } from "../config/env";
import { ApiError, type ApiEnvelope, type ApiErrorEnvelope } from "../types/api";

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
});

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

    const message =
      (error.response?.data as ApiErrorEnvelope | undefined)?.message ??
      (status === undefined ? "Cannot reach the server" : "Something went wrong");

    return Promise.reject(new ApiError(status ?? 0, message));
  },
);

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<ApiEnvelope<T>>(config);
  return response.data.data;
}
