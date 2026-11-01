import { Redirect } from "expo-router";
import { useSession } from "@/features/auth/session-store";
import { useHasSeenWelcome } from "@/features/onboarding/storage";

/**
 * Startup router:
 * 1. Session or flags still loading -> render nothing, splash stays visible.
 * 2. Valid session                   -> /change-password or /(tabs).
 * 3. No session, welcome not seen    -> /welcome.
 * 4. No session, welcome seen        -> /login.
 * Redirect performs a replace so Android back can never return to these gates.
 */
export default function IndexRoute() {
  const { status, session } = useSession();
  const welcome = useHasSeenWelcome();

  if (status === "loading" || welcome.loading) {
    return null;
  }

  if (status === "authenticated" && session) {
    const href = session.user.mustChangePassword ? "/(auth)/change-password" : "/(tabs)";
    return <Redirect href={href} />;
  }

  return <Redirect href={welcome.value ? "/login" : "/welcome"} />;
}
