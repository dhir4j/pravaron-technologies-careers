import type { Metadata } from "next";
import { JobBrowser } from "@/components/job-browser";

export const metadata: Metadata = {
  title: "Open Roles",
  description: "Explore open jobs and internships at Pravaron Technologies.",
};

export default function JobsPage() {
  return (
    <main className="public-page">
      <section className="jobs-hero">
        <p className="eyebrow">Open roles</p>
        <h1>Find the work that fits your edge.</h1>
        <p>
          Search engineering, AI systems, product, and operations opportunities at Pravaron Technologies.
        </p>
      </section>
      <section className="section-shell jobs-browser-section">
        <JobBrowser />
      </section>
    </main>
  );
}
