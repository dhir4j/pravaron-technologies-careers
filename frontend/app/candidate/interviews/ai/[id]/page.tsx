"use client";

import { useParams } from "next/navigation";
import { AIInterviewSession } from "@/components/ai-interview-session";

export default function CandidateAIInterviewPage() {
  const params = useParams();
  return <AIInterviewSession interviewId={params.id as string} />;
}
