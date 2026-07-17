import { JobDetail } from "@/components/job-detail";

export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <JobDetail slug={slug} />;
}
