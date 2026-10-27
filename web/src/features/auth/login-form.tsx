"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError } from "@/shared/types/api";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/form-error";
import { Input } from "@/shared/ui/input";
import { loginSchema, type LoginInput } from "./auth.schema";
import { useLogin } from "./use-auth";

export function LoginForm() {
  const router = useRouter();
  const [values, setValues] = useState<LoginInput>({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
  const login = useLogin();

  function setField(field: keyof LoginInput, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = loginSchema.safeParse(values);

    if (!result.success) {
      const errors: Partial<Record<keyof LoginInput, string>> = {};

      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (field === "email" || field === "password") {
          errors[field] ??= issue.message;
        }
      }

      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    login.mutate(result.data, {
      onSuccess: () => router.replace("/dashboard"),
    });
  }

  const apiMessage = login.error instanceof ApiError ? login.error.message : null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={(event) => setField("email", event.target.value)}
        />
        <FormError message={fieldErrors.email} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={values.password}
          onChange={(event) => setField("password", event.target.value)}
        />
        <FormError message={fieldErrors.password} />
      </div>
      <FormError message={apiMessage} />
      <Button type="submit" isLoading={login.isPending}>
        Sign in
      </Button>
    </form>
  );
}
