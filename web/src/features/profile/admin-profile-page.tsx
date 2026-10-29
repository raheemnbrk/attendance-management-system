"use client";

import { KeyRound, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useLogout } from "@/features/auth/use-auth";
import { apiErrorMessage } from "@/shared/lib/api";
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from "@/features/profile/profile.schema";
import { useChangePassword } from "@/features/profile/use-profile";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { FormError } from "@/shared/ui/form-error";
import { Label } from "@/shared/ui/label";
import { PasswordInput } from "@/shared/components/password-input";
import { Badge } from "@/shared/ui/badge";
import { useAuthStore } from "@/features/auth/auth.store";

// Admins manage their own password here; the profile (name/company) form is
// employer-only, so this page is intentionally read-only + password change.
export function AdminProfilePage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const logout = useLogout();
  const changePassword = useChangePassword();

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  function handlePasswordSubmit(values: ChangePasswordFormValues) {
    changePassword.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          // The backend revokes all sessions after a password change.
          toast.success("Password changed. Please sign in again.");
          logout.mutate();
          router.push("/login");
        },
        onError: (error) => toast.error(apiErrorMessage(error)),
      },
    );
  }

  if (!user) {
    return null;
  }

  const passwordErrors = passwordForm.formState.errors;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your account details and password.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />
            Account
          </CardTitle>
          <CardDescription>Platform administrator account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between gap-4 py-1">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm font-medium">{user.name}</span>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-1">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{user.email}</span>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-1">
            <span className="text-sm text-muted-foreground">Role</span>
            <Badge variant="info">{user.role}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" aria-hidden="true" />
            Change password
          </CardTitle>
          <CardDescription>
            Changing your password signs you out everywhere, including this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="password-form"
            onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
            className="flex flex-col gap-4"
            noValidate
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password-current">Current password</Label>
              <PasswordInput
                id="password-current"
                autoComplete="current-password"
                {...passwordForm.register("currentPassword")}
              />
              <FormError message={passwordErrors.currentPassword?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password-new">New password</Label>
              <PasswordInput
                id="password-new"
                autoComplete="new-password"
                {...passwordForm.register("newPassword")}
              />
              <FormError message={passwordErrors.newPassword?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password-confirm">Confirm new password</Label>
              <PasswordInput
                id="password-confirm"
                autoComplete="new-password"
                {...passwordForm.register("confirmPassword")}
              />
              <FormError message={passwordErrors.confirmPassword?.message} />
            </div>
            <FormError message={apiErrorMessage(changePassword.error)} />
          </form>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" form="password-form" isLoading={changePassword.isPending}>
            Change password
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
