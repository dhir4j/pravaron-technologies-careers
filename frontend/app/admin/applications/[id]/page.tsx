import { AdminApplicationDetail } from "@/components/admin-application-detail";

export default async function AdminApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminApplicationDetail id={id} />;
}
