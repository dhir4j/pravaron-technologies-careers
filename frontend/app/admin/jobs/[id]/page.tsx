import { JobEditor } from "@/components/job-editor";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JobEditor id={id} />;
}
