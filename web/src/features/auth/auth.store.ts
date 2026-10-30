import { create } from "zustand";
import { configureApi } from "@/shared/lib/api";
import type { AuthUser, TokenPair } from "@/shared/types/auth";
import { clearRoleCookie, setRoleCookie } from "./role-cookie";
import { me, refresh } from "./auth.service";

const REFRESH_TOKEN_KEY = "attendance.refreshToken";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

// Employees use the mobile app: the web never keeps a session for them, so no
// tokens are stored and no role cookie is set for that role.
function isEmployee(user: AuthUser): boolean {
  return user.role === "EMPLOYEE";
}

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
    if (isEmployee(user)) {
      clearPersistedRefreshToken();
      clearRoleCookie();
      set({ user: null, accessToken: null, status: "unauthenticated" });
      return;
    }

    persistRefreshToken(tokens.refreshToken);
    // The role cookie drives server-side guards (proxy + route layouts).
    setRoleCookie(user.role);
    set({ user, accessToken: tokens.accessToken, status: "authenticated" });
  },
  setTokens: (tokens) => {
    persistRefreshToken(tokens.refreshToken);
    set({ accessToken: tokens.accessToken, status: "authenticated" });
  },
  clearSession: () => {
    clearPersistedRefreshToken();
    clearRoleCookie();
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

    if (isEmployee(user)) {
      // References to the mobile app only: never restore a web session.
      clearPersistedRefreshToken();
      clearRoleCookie();
      useAuthStore.setState({ user: null, accessToken: null, status: "unauthenticated" });
      return;
    }

    setRoleCookie(user.role);
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
