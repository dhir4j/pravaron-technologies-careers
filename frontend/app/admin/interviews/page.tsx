import { Suspense } from "react";
import { InterviewPage } from "@/components/interview-page";

export default function AdminInterviewsPage() {
  return <Suspense fallback={<div>Loading interviews</div>}><InterviewPage /></Suspense>;
}
