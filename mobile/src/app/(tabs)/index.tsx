import { TodayScreen } from "@/features/attendance/components/TodayScreen";
import { useSession } from "@/features/auth/session-store";

export default function TodayRoute() {
  const { user } = useSession();
  return <TodayScreen user={user} />;
}
