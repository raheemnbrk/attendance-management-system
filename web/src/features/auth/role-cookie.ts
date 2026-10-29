import { ROLE_COOKIE_NAME, roleCookieOptions } from "@/shared/lib/dashboard-path";
import type { Role } from "@/shared/types/auth";

// Client-side keepers for the role hint cookie the proxy and server layouts
// read. Only called from browser modules (auth store); does nothing on SSR.
export function setRoleCookie(role: Role): void {
  if (typeof window === "undefined") {
    return;
  }

  document.cookie = `${ROLE_COOKIE_NAME}=${encodeURIComponent(role)}; ${roleCookieOptions}`;
}

export function clearRoleCookie(): void {
  if (typeof window === "undefined") {
    return;
  }

  document.cookie = `${ROLE_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}
