"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Application } from "@/lib/types";
import { EmptyState, Feedback, LoadingBlock, PageIntro, StatusBadge } from "@/components/ui";

export function CandidateApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ applications: Application[] }>("/candidate/applications")
      .then((response) => setApplications(response.applications))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock label="Loading applications" />;

  return (
    <>
      <PageIntro
        title="My applications"
        body="Review every submission and follow the latest candidate-facing status."
        action={<Link className="button button-primary" href="/jobs">Explore roles</Link>}
      />
      {error ? <Feedback tone="error">{error}</Feedback> : null}
      {applications.length ? (
        <div className="application-list">
          {applications.map((application) => (
            <article key={application.id}>
              <div>
                <StatusBadge value={application.candidate_status} />
                <h2>{application.job.title}</h2>
                <p>{application.job.role_summary}</p>
              </div>
              <dl>
                <div><dt>Job code</dt><dd>{application.job.public_code}</dd></div>
                <div><dt>Applied</dt><dd>{formatDate(application.created_at)}</dd></div>
                <div><dt>Last update</dt><dd>{formatDate(application.updated_at)}</dd></div>
              </dl>
              <Link className="icon-button" href={`/candidate/applications/${application.id}`} aria-label={`View ${application.job.title}`}>
                <ArrowRight size={19} />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No applications yet" body="Browse open roles and submit your first application." />
      )}
    </>
  );
}
