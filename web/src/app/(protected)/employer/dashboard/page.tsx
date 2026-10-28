"use client";

import { useQuery } from "@tanstack/react-query";
import { me } from "@/features/auth/auth.service";

export default function DashboardPage() {
  const { data: user, isPending, isError } = useQuery({ queryKey: ["me"], queryFn: me });

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading profile...</p>;
  }

  if (isError || !user) {
    return <p className="text-sm text-destructive">Could not load your profile.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome, {user.name}</h1>
      <dl className="grid w-full max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Email</dt>
        <dd>{user.email}</dd>
        <dt className="text-muted-foreground">Role</dt>
        <dd>{user.role}</dd>
        <dt className="text-muted-foreground">Department</dt>
        <dd>{user.department ?? "—"}</dd>
        <dt className="text-muted-foreground">Company</dt>
        <dd>{user.company ?? "—"}</dd>
        <dt className="text-muted-foreground">Status</dt>
        <dd>{user.status}</dd>
      </dl>
    </div>
  );
}
