import { LoginForm } from "@/features/auth/components/LoginForm";
import { AuthScreen } from "@/shared/components/auth/AuthScreen";

export default function LoginRoute() {
  return (
    <AuthScreen>
      <LoginForm />
    </AuthScreen>
  );
}
