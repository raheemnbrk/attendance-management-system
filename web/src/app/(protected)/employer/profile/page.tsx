"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, UserRound } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/features/auth/auth.store";
import { ApiError } from "@/shared/types/api";
import { useLogout } from "@/features/auth/use-auth";
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordFormValues,
  type UpdateProfileFormValues,
} from "@/features/profile/profile.schema";
import { useChangePassword, useUpdateProfile } from "@/features/profile/use-profile";
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
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";

function apiErrorMessage(error: unknown): string | null {
  return error instanceof ApiError ? error.message : null;
}

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const profileForm = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name ?? "",
      company: user?.company ?? "",
    },
  });

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  if (!user) {
    return null;
  }

  function handleProfileSubmit(values: UpdateProfileFormValues) {
    updateProfile.mutate(values, {
      onSuccess: (updated) => {
        profileForm.reset({ name: updated.name, company: updated.company ?? "" });
        toast.success("Profile updated");
      },
      onError: (error) => toast.error(apiErrorMessage(error) ?? "Could not update profile"),
    });
  }

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
        onError: (error) => toast.error(apiErrorMessage(error) ?? "Could not change password"),
      },
    );
  }

  const profileErrors = profileForm.formState.errors;
  const passwordErrors = passwordForm.formState.errors;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account details and password.</p>
      </div>

      {/* Profile */}
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="size-4 text-muted-foreground" aria-hidden="true" />
            Account
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            {user.email}
            <Badge variant="muted">{user.role}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="profile-form"
            onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
            className="flex flex-col gap-4"
            noValidate
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-name">Name</Label>
              <Input id="profile-name" autoComplete="name" {...profileForm.register("name")} />
              <FormError message={profileErrors.name?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-company">Company</Label>
              <Input
                id="profile-company"
                placeholder="Your company name"
                {...profileForm.register("company")}
              />
              <FormError message={profileErrors.company?.message} />
            </div>
            <FormError message={apiErrorMessage(updateProfile.error)} />
          </form>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => profileForm.reset({ name: user.name, company: user.company ?? "" })}
          >
            Reset
          </Button>
          <Button type="submit" form="profile-form" isLoading={updateProfile.isPending}>
            Save changes
          </Button>
        </CardFooter>
      </Card>

      {/* Password */}
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
              <Input
                id="password-current"
                type="password"
                autoComplete="current-password"
                {...passwordForm.register("currentPassword")}
              />
              <FormError message={passwordErrors.currentPassword?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password-new">New password</Label>
              <Input
                id="password-new"
                type="password"
                autoComplete="new-password"
                {...passwordForm.register("newPassword")}
              />
              <FormError message={passwordErrors.newPassword?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password-confirm">Confirm new password</Label>
              <Input
                id="password-confirm"
                type="password"
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
