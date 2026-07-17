"use client";

import Link from "next/link";
import { ArrowRight, Bell, BriefcaseBusiness, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { formatDate, profileCompletion } from "@/lib/format";
import type { Application, Job, Notification, Profile } from "@/lib/types";
import { EmptyState, Feedback, LoadingBlock, Metric, PageIntro, StatusBadge } from "@/components/ui";

export function CandidateOverview() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api<{ applications: Application[] }>("/candidate/applications"),
      api<{ notifications: Notification[] }>("/candidate/notifications"),
      api<{ jobs: Job[] }>("/public/jobs"),
      api<{ profile: Profile }>("/candidate/profile"),
    ])
      .then(([applicationResponse, notificationResponse, jobResponse, profileResponse]) => {
        setApplications(applicationResponse.applications);
        setNotifications(notificationResponse.notifications);
        setJobs(jobResponse.jobs);
        setProfile(profileResponse.profile);
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock label="Loading dashboard" />;
  if (error) return <Feedback tone="error">{error}</Feedback>;

  const activeApplications = applications.filter(
    (item) => !["Application Withdrawn", "Not Selected", "Hired"].includes(item.candidate_status),
  );
  const unread = notifications.filter((item) => !item.read_at).length;
  const completion = profileCompletion(profile as Record<string, unknown>);

  return (
    <>
      <PageIntro
        eyebrow="Candidate workspace"
        title={`Welcome, ${user?.full_name.split(" ")[0] || "candidate"}`}
        body="Track your applications, profile, and hiring updates in one place."
        action={<Link className="button button-primary" href="/jobs">Explore roles</Link>}
      />
      <section className="metric-grid">
        <Metric label="Active applications" value={activeApplications.length} detail={`${applications.length} total`} />
        <Metric label="Profile completion" value={`${completion}%`} detail={completion === 100 ? "Ready to apply" : "Add missing details"} />
        <Metric label="Unread updates" value={unread} detail={`${notifications.length} total notifications`} />
      </section>

      <div className="dashboard-grid">
        <section className="panel panel-wide">
          <div className="panel-heading">
            <div><BriefcaseBusiness size={20} /><h2>Recent applications</h2></div>
            <Link href="/candidate/applications">View all</Link>
          </div>
          {applications.length ? (
            <div className="compact-list">
              {applications.slice(0, 4).map((application) => (
                <Link href={`/candidate/applications/${application.id}`} key={application.id}>
                  <span>
                    <strong>{application.job.title}</strong>
                    <small>{application.job.public_code} | Updated {formatDate(application.updated_at)}</small>
                  </span>
                  <StatusBadge value={application.candidate_status} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No applications yet"
              body="Open roles are ready when you find the right fit."
              action={<Link className="button button-secondary" href="/jobs">Browse roles</Link>}
            />
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div><UserRound size={20} /><h2>Profile readiness</h2></div>
          </div>
          <div className="readiness-score">
            <strong>{completion}%</strong>
            <span>complete</span>
          </div>
          <p>Complete contact, work, and portfolio details before your next application.</p>
          <Link className="text-link" href="/candidate/profile">Update profile <ArrowRight size={16} /></Link>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div><Bell size={20} /><h2>Latest updates</h2></div>
            <Link href="/candidate/notifications">View all</Link>
          </div>
          {notifications.length ? (
            <div className="notification-preview">
              {notifications.slice(0, 3).map((notification) => (
                <div key={notification.id}>
                  <strong>{notification.subject}</strong>
                  <p>{notification.message}</p>
                  <small>{formatDate(notification.created_at, true)}</small>
                </div>
              ))}
            </div>
          ) : <p className="panel-muted">New hiring updates will appear here.</p>}
        </section>

        <section className="panel panel-wide">
          <div className="panel-heading">
            <div><BriefcaseBusiness size={20} /><h2>More open roles</h2></div>
            <Link href="/jobs">Browse all</Link>
          </div>
          <div className="recommended-jobs">
            {jobs.slice(0, 3).map((job) => (
              <Link href={`/jobs/${job.public_code}/${job.slug}`} key={job.id}>
                <span><strong>{job.title}</strong><small>{job.department} | {job.workplace_model}</small></span>
                <ArrowRight size={17} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
