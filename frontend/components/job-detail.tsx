"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Job } from "@/lib/types";
import { Feedback, LoadingBlock, StatusBadge } from "@/components/ui";

export function JobDetail({ slug }: { slug: string }) {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ job: Job }>(`/public/jobs/${slug}`)
      .then((response) => setJob(response.job))
      .catch((requestError: Error) => setError(requestError.message));
  }, [slug]);

  if (error) return <div className="section-shell public-page"><Feedback tone="error">{error}</Feedback></div>;
  if (!job) return <main className="public-page"><LoadingBlock label="Loading role" /></main>;

  const contentSections = (job.content_sections?.length
    ? job.content_sections
    : [
        { id: "responsibilities", title: "What you will do", content: job.responsibilities || "" },
        { id: "requirements", title: "What you should bring", content: job.required_skills.join("\n") },
        { id: "preferred", title: "Useful additional experience", content: job.preferred_skills.join("\n") },
        { id: "education", title: "Education", content: job.education_preference || "" },
        { id: "experience", title: "Experience", content: job.experience_requirement || "" },
      ]).filter((section) => section.title && section.content);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    identifier: {
      "@type": "PropertyValue",
      name: "Pravaron Technologies",
      value: job.public_code,
    },
    description: job.role_summary,
    datePosted: job.created_at,
    validThrough: job.application_deadline,
    employmentType: job.employment_type.toUpperCase().replaceAll("-", "_"),
    educationRequirements: job.education_preference,
    experienceRequirements: job.experience_requirement,
    hiringOrganization: {
      "@type": "Organization",
      name: "Pravaron Technologies Pvt. Ltd.",
      sameAs: "https://pravarontechnologies.com",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location || "Noida",
        addressCountry: "IN",
      },
    },
  };

  return (
    <main className="job-detail-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="section-shell">
        <Link className="back-link" href="/jobs">
          <ArrowLeft size={17} />
          All open roles
        </Link>
        <div className="job-detail-layout">
          <div className="job-detail-main">
            <header className="job-detail-header">
            <StatusBadge value={job.employment_type} />
            <h1>{job.title}</h1>
            <p>{job.role_summary}</p>
            </header>
            <article className="job-detail-sections">
              {contentSections.map((section) => (
                <section key={section.id}>
                  <h2>{section.title}</h2>
                  {section.id === "requirements" || section.id === "preferred" ? (
                    <div className={`skill-list ${section.id === "preferred" ? "muted-skills" : ""}`}>
                      {section.content.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean).map((item) => <span key={item}>{item}</span>)}
                    </div>
                  ) : <p className="pre-line">{section.content}</p>}
                </section>
              ))}
            </article>
          </div>
          <div className="job-detail-sidebar">
            <aside className="job-detail-facts">
              <div><MapPin size={18} /><span>{job.location || "Location flexible"}</span></div>
              <div>
                <CalendarDays size={18} />
                <span>{job.application_status_text || (job.application_deadline ? `Apply by ${formatDate(job.application_deadline)}` : "Applications open")}</span>
              </div>
              <dl>
                <div><dt>Job ID</dt><dd>{job.public_code}</dd></div>
                <div><dt>Team</dt><dd>{job.department || "Engineering"}</dd></div>
                <div><dt>Workplace</dt><dd>{job.workplace_model}</dd></div>
                <div><dt>Experience</dt><dd>{job.experience_level || "Open"}</dd></div>
                <div><dt>Openings</dt><dd>{job.openings}</dd></div>
              </dl>
              <Link className="button button-primary button-wide" href={`/apply/${job.id}`}>Apply now<ArrowRight size={18} /></Link>
            </aside>
            <aside className="job-support">
              <strong>Questions about this role?</strong>
              <p>Contact the Pravaron Technologies hiring team for role or accessibility support.</p>
              <a href={`mailto:careers@pravarontechnologies.com?subject=${encodeURIComponent(job.title)}`}>careers@pravarontechnologies.com</a>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
