"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Building2, CircleCheck, Lock, Mail, UserRound } from "lucide-react";
import { ApiError } from "@/shared/types/api";
import { PasswordStrength, PasswordInput } from "@/shared/components/password-input";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/form-error";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  registerEmployerSchema,
  type RegisterEmployerFormValues,
} from "./auth.schema";
import { registerEmployer } from "./auth.service";

function apiErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Could not submit the request";
}

export function RegisterForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<RegisterEmployerFormValues>({
    resolver: zodResolver(registerEmployerSchema),
    defaultValues: { name: "", company: "", email: "", password: "" },
  });

  function handleSubmit(values: RegisterEmployerFormValues) {
    setSubmitting(true);
    const company = values.company?.trim();
    registerEmployer({
      name: values.name,
      email: values.email,
      // Backend treats an empty-string company as invalid; omit when empty.
      ...(company ? { company } : {}),
      password: values.password,
    })
      .then(() => {
        setSubmitted(true);
        toast.success("Registration submitted");
      })
      .catch((error) => {
        toast.error(apiErrorMessage(error));
      })
      .finally(() => setSubmitting(false));
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-5 text-center">
        <div className="flex flex-col items-center gap-3" role="status">
          <CircleCheck className="size-10 text-success" aria-hidden="true" />
          <h2 className="text-xl font-semibold tracking-tight">Request submitted</h2>
          <p className="text-sm text-muted-foreground">
            An admin will review your account. You can sign in once it is approved.
          </p>
          <Button asChild variant="outline" className="mt-2 w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Register your company</h2>
        <p className="text-sm text-muted-foreground">
          Create an employer account. An admin reviews every request.
        </p>
      </div>

      <form
        id="register-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="register-name">Name</Label>
          <div className="relative">
            <UserRound
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="register-name"
              autoComplete="name"
              placeholder="Your full name"
              className="pl-9"
              {...form.register("name")}
            />
          </div>
          <FormError message={form.formState.errors.name?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="register-company">
            Company <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <div className="relative">
            <Building2
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="register-company"
              placeholder="Company name"
              autoComplete="organization"
              className="pl-9"
              {...form.register("company")}
            />
          </div>
          <FormError message={form.formState.errors.company?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="register-email">Email</Label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="pl-9"
              {...form.register("email")}
            />
          </div>
          <FormError message={form.formState.errors.email?.message} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="register-password">Password</Label>
          <PasswordInput
            id="register-password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            leadingIcon={<Lock className="size-4" aria-hidden="true" />}
            {...form.register("password")}
          />
          <PasswordStrength password={form.watch("password")} />
          <FormError message={form.formState.errors.password?.message} />
        </div>

        <Button type="submit" isLoading={submitting} className="w-full">
          Request access
        </Button>
      </form>
    </div>
  );
}
