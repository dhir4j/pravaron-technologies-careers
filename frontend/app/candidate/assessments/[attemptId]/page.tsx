"use client";

import { useParams } from "next/navigation";
import { AssessmentAttemptView } from "@/components/assessment-attempt";

export default function AttemptPage() {
  const params = useParams();
  return <AssessmentAttemptView attemptId={params.attemptId as string} />;
}
