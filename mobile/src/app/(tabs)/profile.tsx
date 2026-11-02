import { useRouter } from "expo-router";
import { ProfileScreen } from "@/features/profile/components/ProfileScreen";
import { useLogout } from "@/features/auth/hooks";
import { useSession } from "@/features/auth/session-store";

export default function ProfileRoute() {
  const router = useRouter();
  const { user } = useSession();
  const logout = useLogout();

  return (
    <ProfileScreen
      user={user}
      loggingOut={logout.isPending}
      onPressChangePassword={() => {
        router.push("/(auth)/change-password");
      }}
      onLogout={() => {
        void logout.mutateAsync().finally(() => {
          router.replace("/login");
        });
      }}
    />
  );
}
