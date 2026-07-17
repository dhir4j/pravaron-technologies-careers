import { CandidateApplicationDetail } from "@/components/candidate-application-detail";

export default async function CandidateApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CandidateApplicationDetail id={id} />;
}
