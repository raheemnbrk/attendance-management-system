import * as SecureStore from "expo-secure-store";
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clearTokens, loadTokens, saveTokens } from "@/shared/lib/token-storage";
import type { AppUser, AuthTokens } from "@/shared/types";

const USER_KEY = "punchin.user";

export type Session = {
  tokens: AuthTokens;
  user: AppUser;
};

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

type SessionContextValue = {
  status: SessionStatus;
  session: Session | null;
  user: AppUser | null;
  signIn: (tokens: AuthTokens, user: AppUser) => Promise<void>;
  updateTokens: (tokens: AuthTokens) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

async function loadStoredUser(): Promise<AppUser | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppUser;
    return parsed && typeof parsed.id === "string" ? parsed : null;
  } catch {
    return null;
  }
}

async function persistUser(user: AppUser | null): Promise<void> {
  try {
    if (user) {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } else {
      await SecureStore.deleteItemAsync(USER_KEY);
    }
  } catch {
    // Store failures keep the session working from memory for this run.
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const tokens = await loadTokens();
      if (!tokens) {
        if (active) setStatus("unauthenticated");
        return;
      }
      const user = await loadStoredUser();
      if (!user) {
        await clearTokens();
        if (active) setStatus("unauthenticated");
        return;
      }
      if (active) {
        setSession({ tokens, user });
        setStatus("authenticated");
      }
    })().catch(() => {
      if (active) setStatus("unauthenticated");
    });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (tokens: AuthTokens, user: AppUser) => {
    await saveTokens(tokens);
    await persistUser(user);
    setSession({ tokens, user });
    setStatus("authenticated");
  }, []);

  const updateTokens = useCallback(async (tokens: AuthTokens) => {
    await saveTokens(tokens);
    setSession((current) => (current ? { ...current, tokens } : current));
  }, []);

  const signOut = useCallback(async () => {
    await persistUser(null);
    await clearTokens();
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ status, session, user: session?.user ?? null, signIn, updateTokens, signOut }),
    [status, session, signIn, updateTokens, signOut],
  );

  return createElement(SessionContext.Provider, { value }, children);
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
