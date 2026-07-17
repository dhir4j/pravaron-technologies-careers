import { JobDetail } from "@/components/job-detail";

export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string; detailSlug: string }>;
}) {
  const { detailSlug } = await params;
  return <JobDetail slug={detailSlug} />;
}
