import { ApplicationForm } from "@/components/application-form";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  return <ApplicationForm jobId={jobId} />;
}
