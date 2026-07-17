"use client";

import { useSearchParams } from "next/navigation";
import { InterviewManager } from "@/components/admin-directory";

export function InterviewPage() {
  const params = useSearchParams();
  return <InterviewManager initialApplicationId={params.get("application") || ""} />;
}
