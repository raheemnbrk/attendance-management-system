import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm";
import { Screen } from "@/shared/components/layout/Screen";

export default function ChangePasswordRoute() {
  return (
    <Screen keyboard scroll padded contentStyle={{ flexGrow: 1, justifyContent: "center" }}>
      <ChangePasswordForm />
    </Screen>
  );
}
