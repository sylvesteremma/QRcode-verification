import { AdminWorkspace } from "@/components/admin-workspace";

export default function AdminSectionPage({
  params,
}: {
  params: { section: string };
}) {
  return <AdminWorkspace section={params.section} />;
}
