import { create } from "zustand";
import { configureApi } from "@/shared/lib/api";
import type { AuthUser, TokenPair } from "@/shared/types/auth";
import { me, refresh } from "./auth.service";

const REFRESH_TOKEN_KEY = "attendance.refreshToken";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  status: AuthStatus;
  setSession: (user: AuthUser, tokens: TokenPair) => void;
  setTokens: (tokens: TokenPair) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: "loading",
  setSession: (user, tokens) => {
    persistRefreshToken(tokens.refreshToken);
    set({ user, accessToken: tokens.accessToken, status: "authenticated" });
  },
  setTokens: (tokens) => {
    persistRefreshToken(tokens.refreshToken);
    set({ accessToken: tokens.accessToken, status: "authenticated" });
  },
  clearSession: () => {
    clearPersistedRefreshToken();
    set({ user: null, accessToken: null, status: "unauthenticated" });
  },
}));

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

function persistRefreshToken(refreshToken: string): void {
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearPersistedRefreshToken(): void {
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// The access token lives in memory only; the single-use refresh token is the
// only persisted piece, so a reload can silently restore the session.
async function runBootstrap(): Promise<void> {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    useAuthStore.getState().clearSession();
    return;
  }

  try {
    const tokens = await refresh(refreshToken);
    useAuthStore.getState().setTokens(tokens);
    const user = await me();
    useAuthStore.setState({ user, status: "authenticated" });
  } catch {
    useAuthStore.getState().clearSession();
  }
}

let bootstrapPromise: Promise<void> | null = null;

// Concurrent mounts (e.g. React StrictMode double-running effects) must share
// a single refresh call: refresh tokens are single-use and the backend
// revokes the whole family when a revoked token is reused, so a duplicate
// call would sign the user out.
export function bootstrapAuth(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = runBootstrap().finally(() => {
      bootstrapPromise = null;
    });
  }

  return bootstrapPromise;
}

configureApi({
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: getStoredRefreshToken,
  onTokensRefreshed: (tokens) => useAuthStore.getState().setTokens(tokens),
  onAuthFailure: () => useAuthStore.getState().clearSession(),
});
