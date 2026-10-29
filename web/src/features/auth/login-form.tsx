"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Clock, Lock, Mail } from "lucide-react";
import { getDashboardPath } from "@/shared/lib/dashboard-path";
import { ApiError } from "@/shared/types/api";
import { PasswordInput } from "@/shared/components/password-input";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/form-error";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { loginSchema, type LoginInput } from "./auth.schema";
import { useLogin } from "./use-auth";

type ServerAlert = {
  variant: "destructive" | "warning" | "info";
  title: string;
  description?: string;
  icon?: React.ReactNode;
};

// Shape the server error by case: unknown credentials (destructive), pending
// or rejected reviews, a suspended manager, and rate limiting (warning).
function toServerAlert(error: unknown): ServerAlert {
  if (!(error instanceof ApiError)) {
    return {
      variant: "destructive",
      title: "Sign in failed",
      description: "Cannot reach the server. Please try again.",
    };
  }

  const message = error.message;

  if (error.status === 401) {
    return { variant: "destructive", title: "Invalid email or password" };
  }

  if (error.status === 429) {
    return {
      variant: "warning",
      title: "Too many attempts, try again later",
      description: "Wait a few minutes before trying to sign in again.",
    };
  }

  if (message.includes("awaiting approval")) {
    return {
      variant: "warning",
      title: message,
      description: "We will let you know once an admin reviews your request.",
      icon: <Clock aria-hidden="true" />,
    };
  }

  if (message.includes("rejected")) {
    return {
      variant: "destructive",
      title: "Account rejected",
      description: message,
    };
  }

  if (message.includes("suspended") || message.includes("deactivated")) {
    return {
      variant: "warning",
      title: message.includes("suspended") ? "Account suspended" : "Account disabled",
      description: message,
    };
  }

  return { variant: "destructive", title: "Sign in failed", description: message };
}

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const [roleNotice, setRoleNotice] = useState<"employee" | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function handleSubmit(values: LoginInput) {
    login.mutate(values, {
      onSuccess: (data) => {
        if (data.user.role === "EMPLOYEE") {
          setRoleNotice("employee");
          return;
        }
        // Role-aware: ADMIN -> /admin/dashboard, EMPLOYER -> /employer/dashboard.
        router.replace(getDashboardPath(data.user.role));
      },
    });
  }

  const serverAlert = login.error ? toServerAlert(login.error) : null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
        <p className="text-sm text-muted-foreground">Sign in to your account</p>
      </div>

      {serverAlert ? (
        <Alert variant={serverAlert.variant}>
          {serverAlert.icon}
          <AlertTitle>{serverAlert.title}</AlertTitle>
          {serverAlert.description ? (
            <AlertDescription>{serverAlert.description}</AlertDescription>
          ) : null}
        </Alert>
      ) : null}

      {roleNotice === "employee" ? (
        <Alert variant="info">
          <Mail aria-hidden="true" />
          <AlertTitle>Employee accounts use the mobile app</AlertTitle>
          <AlertDescription>This web dashboard is for employers.</AlertDescription>
        </Alert>
      ) : null}

      <form
        id="login-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-email">Email</Label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="pl-9"
              {...form.register("email")}
            />
          </div>
          <FormError message={form.formState.errors.email?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-password">Password</Label>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            placeholder="Your password"
            leadingIcon={<Lock className="size-4" aria-hidden="true" />}
            {...form.register("password")}
          />
          <FormError message={form.formState.errors.password?.message} />
        </div>

        <Button type="submit" isLoading={login.isPending} className="w-full">
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Employer without an account?{" "}
        <Link
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Register your company
        </Link>
      </p>
    </div>
  );
}
