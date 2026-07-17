"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CalendarDays, FileSearch } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AdminMetrics, Application, Interview } from "@/lib/types";
import { Feedback, LoadingBlock, Metric, PageIntro, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";

export function AdminOverview() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api<{ metrics: AdminMetrics }>("/admin/dashboard"),
      api<{ applications: Application[] }>("/admin/applications"),
      api<{ interviews: Interview[] }>("/admin/interviews"),
    ])
      .then(([metricResponse, applicationResponse, interviewResponse]) => {
        setMetrics(metricResponse.metrics);
        setApplications(applicationResponse.applications);
        setInterviews(interviewResponse.interviews);
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock label="Loading recruitment overview" />;
  if (error || !metrics) return <Feedback tone="error">{error || "Metrics unavailable"}</Feedback>;

  return (
    <>
      <PageIntro
        eyebrow="Hiring operations"
        title="Recruitment overview"
        body="Review workload, move candidates forward, and keep decisions visible."
        action={<Link className="button button-primary" href="/admin/jobs/new">Create job</Link>}
      />
      <section className="metric-grid metric-grid-admin">
        <Metric label="Open jobs" value={metrics.open_jobs} />
        <Metric label="Active applications" value={metrics.active_applications} />
        <Metric label="Awaiting review" value={metrics.awaiting_review} />
        <Metric label="Shortlisted" value={metrics.shortlisted} />
        <Metric label="Interviews" value={metrics.interviews_scheduled} />
        <Metric label="Hires completed" value={metrics.hires_completed} />
      </section>
      <div className="dashboard-grid">
        <section className="panel panel-wide">
          <div className="panel-heading">
            <div><FileSearch size={20} /><h2>Recruitment work queue</h2></div>
            <Link href="/admin/applications">Open queue</Link>
          </div>
          <div className="compact-list">
            {applications.slice(0, 6).map((application) => (
              <Link href={`/admin/applications/${application.id}`} key={application.id}>
                <span>
                  <strong>{application.candidate?.full_name || "Candidate"}</strong>
                  <small>{application.job.title} | {formatDate(application.created_at)}</small>
                </span>
                <StatusBadge value={application.internal_status || application.candidate_status} />
              </Link>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div><BriefcaseBusiness size={20} /><h2>Today</h2></div>
          </div>
          <div className="admin-today">
            <strong>{metrics.new_applications_today}</strong>
            <span>new applications</span>
            <strong>{metrics.offers_released}</strong>
            <span>offers released</span>
          </div>
        </section>
        <section className="panel panel-wide">
          <div className="panel-heading">
            <div><CalendarDays size={20} /><h2>Upcoming interviews</h2></div>
            <Link href="/admin/interviews">Manage</Link>
          </div>
          {interviews.length ? (
            <div className="recommended-jobs">
              {interviews.slice(0, 4).map((interview) => (
                <Link href={`/admin/applications/${interview.application_id}`} key={interview.id}>
                  <span>
                    <strong>{interview.interview_type}</strong>
                    <small>{formatDate(interview.starts_at, true)} | {interview.meeting_mode}</small>
                  </span>
                  <ArrowRight size={17} />
                </Link>
              ))}
            </div>
          ) : <p className="panel-muted">No interviews scheduled.</p>}
        </section>
      </div>
    </>
  );
}
