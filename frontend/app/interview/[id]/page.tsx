"use client";

import { useParams } from "next/navigation";
import { PublicInterviewEntry } from "@/components/public-interview-entry";

export default function PublicInterviewPage() {
  const params = useParams();
  return <PublicInterviewEntry interviewId={params.id as string} />;
}