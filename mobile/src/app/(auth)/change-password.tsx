import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm";
import { AuthScreen } from "@/shared/components/auth/AuthScreen";

export default function ChangePasswordRoute() {
  return (
    <AuthScreen>
      <ChangePasswordForm />
    </AuthScreen>
  );
}
