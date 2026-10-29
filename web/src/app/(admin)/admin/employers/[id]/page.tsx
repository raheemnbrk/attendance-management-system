import { AdminEmployerDetailsPage } from "@/features/employers/admin-employer-details-page";

export const metadata = {
  title: "Employer details",
};

export default async function AdminEmployerDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminEmployerDetailsPage id={id} />;
}
