import * as SecureStore from "expo-secure-store";
import type { AuthTokens } from "@/shared/types";

const TOKENS_KEY = "punchin.tokens";

// In-memory mirror so requests can attach the access token synchronously and
// keep working even if SecureStore is unavailable (e.g. web dev preview).
let tokens: AuthTokens | null = null;

export async function loadTokens(): Promise<AuthTokens | null> {
  if (tokens) {
    return tokens;
  }
  try {
    const raw = await SecureStore.getItemAsync(TOKENS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AuthTokens>;
      if (parsed && typeof parsed.accessToken === "string" && typeof parsed.refreshToken === "string") {
        tokens = { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken };
      }
    }
  } catch {
    tokens = null;
  }
  return tokens;
}

export function getAccessTokenSync(): string | null {
  return tokens?.accessToken ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  return (await loadTokens())?.refreshToken ?? null;
}

export async function saveTokens(next: AuthTokens): Promise<void> {
  tokens = next;
  try {
    await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(next));
  } catch {
    // Persistence failed (likely an unsupported platform); keep serving from
    // the in-memory mirror for the current session.
  }
}

export async function clearTokens(): Promise<void> {
  tokens = null;
  try {
    await SecureStore.deleteItemAsync(TOKENS_KEY);
  } catch {
    // Ignore; the mirror is already empty.
  }
}
