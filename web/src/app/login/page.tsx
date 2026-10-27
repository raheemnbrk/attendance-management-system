import { LoginForm } from "@/features/auth/login-form";
import { env } from "@/shared/config/env";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-16">
      <div className="w-full max-w-sm rounded-xl border border-black/[.08] p-8 dark:border-white/[.145]">
        <h1 className="mb-6 text-xl font-semibold tracking-tight">
          Sign in to {env.NEXT_PUBLIC_APP_NAME}
        </h1>
        <LoginForm />
      </div>
    </div>
  );
}
