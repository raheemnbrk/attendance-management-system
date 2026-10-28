"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Employee } from "./employees.service";
import {
  createEmployeeSchema,
  editEmployeeSchema,
  type CreateEmployeeFormValues,
  type EditEmployeeFormValues,
} from "./employees.schema";
import { FormError } from "@/shared/ui/form-error";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      <FormError message={error} />
    </div>
  );
}

export function CreateEmployeeForm({
  onSubmit,
  isSubmitting,
  apiError,
}: {
  onSubmit: (values: CreateEmployeeFormValues) => void;
  isSubmitting: boolean;
  apiError?: string | null;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateEmployeeFormValues>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: { name: "", email: "", department: "" },
  });

  return (
    <form
      id="create-employee-form"
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <Field id="employee-name" label="Name" error={errors.name?.message}>
        <Input id="employee-name" placeholder="Full name" autoComplete="off" {...register("name")} />
      </Field>
      <Field id="employee-email" label="Email" error={errors.email?.message}>
        <Input
          id="employee-email"
          type="email"
          placeholder="employee@example.com"
          autoComplete="off"
          {...register("email")}
        />
      </Field>
      <Field id="employee-department" label="Department (optional)" error={errors.department?.message}>
        <Input id="employee-department" placeholder="e.g. Engineering" {...register("department")} />
      </Field>
      <p className="text-xs text-muted-foreground">
        A temporary password is generated automatically and shown once after creation.
      </p>
      <FormError message={apiError} />
      <button type="submit" className="hidden" disabled={isSubmitting} />
    </form>
  );
}

export function EditEmployeeForm({
  employee,
  onSubmit,
  isSubmitting,
  apiError,
}: {
  employee: Employee;
  onSubmit: (values: EditEmployeeFormValues) => void;
  isSubmitting: boolean;
  apiError?: string | null;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditEmployeeFormValues>({
    resolver: zodResolver(editEmployeeSchema),
    defaultValues: {
      name: employee.name,
      department: employee.department ?? "",
    },
  });

  return (
    <form
      id="edit-employee-form"
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <Field id="edit-employee-name" label="Name" error={errors.name?.message}>
        <Input id="edit-employee-name" placeholder="Full name" {...register("name")} />
      </Field>
      <Field id="edit-employee-department" label="Department" error={errors.department?.message}>
        <Input id="edit-employee-department" placeholder="e.g. Engineering" {...register("department")} />
      </Field>
      <FormError message={apiError} />
      <button type="submit" className="hidden" disabled={isSubmitting} />
    </form>
  );
}
