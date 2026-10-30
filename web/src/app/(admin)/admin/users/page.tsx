import { Suspense } from "react";
import { AdminUsersPage } from "@/features/users/admin-users-page";

export const metadata = {
  title: "Users",
};

// useSearchParams inside the users page needs a Suspense boundary so the outer
// shell can still be prerendered.
export default function AdminUsers() {
  return (
    <Suspense fallback={<div className="min-h-40" aria-busy="true" />}>
      <AdminUsersPage />
    </Suspense>
  );
}
