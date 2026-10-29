"use client";

import Link from "next/link";
import { RegisterForm } from "@/features/auth/register-form";

// Same split-screen layout as /login, rendered by the (auth) layout — this
// page only adds the form plus the back-to-login footer.
export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-5">
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
