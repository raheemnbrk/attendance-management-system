import { apiGet } from "@/shared/api/client";
import type { AppUser } from "@/shared/types";

/** Fresh copy of the signed-in user; the profile screen renders the cached
 * session user and this stays available for future refresh flows. */
export async function getMe(): Promise<AppUser> {
  return (await apiGet<AppUser>("/users/me")).data;
}
