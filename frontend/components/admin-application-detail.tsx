"use client";

import Link from "next/link";
import { ArrowLeft, CalendarPlus, ExternalLink, FileText, UserPlus } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate, humanize } from "@/lib/format";
import type { Application, User } from "@/lib/types";
import { Feedback, LoadingBlock, StatusBadge } from "@/components/ui";

const statuses = [
  "New",
  "Assigned for Review",
  "Under Review",
  "Shortlisted",
  "Interview Scheduled",
  "Interview Completed",
  "Offer Sent",
  "Hired",
  "Rejected",
  "Withdrawn",
];

export function AdminApplicationDetail({ id }: { id: string }) {
  const [application, setApplication] = useState<Application | null>(null);
  const [reviewers, setReviewers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      api<{ application: Application }>(`/admin/applications/${id}`),
      api<{ users: User[] }>("/admin/users").catch(() => ({ users: [] })),
    ])
      .then(([applicationResponse, userResponse]) => {
        setApplication(applicationResponse.application);
        setReviewers(userResponse.users.filter((user) => user.role !== "candidate"));
      })
      .catch((requestError: Error) => setError(requestError.message));
  }, [id]);

  useEffect(load, [load]);

  async function updateStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await api<{ application: Application }>(
        `/admin/applications/${id}/status`,
        {
          method: "PATCH",
          body: {
            internal_status: form.get("internal_status"),
            note: form.get("note"),
            rejection_reason: form.get("rejection_reason") || null,
          },
        },
      );
      setApplication((current) => current ? { ...current, ...response.application } : response.application);
      setSuccess("Application status updated and candidate notification created.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Status update failed");
    } finally {
      setSaving(false);
    }
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await api(`/admin/applications/${id}/notes`, {
        method: "POST",
        body: { body: data.get("body") },
      });
      form.reset();
      setSuccess("Internal note added.");
      load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Note failed");
    } finally {
      setSaving(false);
    }
  }

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      await api(`/admin/applications/${id}/assignments`, {
        method: "POST",
        body: { reviewer_id: form.get("reviewer_id") },
      });
      setSuccess("Reviewer assigned.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Assignment failed");
    } finally {
      setSaving(false);
    }
  }

  if (!application) {
    return error ? <Feedback tone="error">{error}</Feedback> : <LoadingBlock label="Loading candidate application" />;
  }

  return (
    <>
      <Link className="back-link" href="/admin/applications"><ArrowLeft size={17} /> Applications</Link>
      <header className="application-detail-heading admin-detail-heading">
        <div>
          <StatusBadge value={application.internal_status || application.candidate_status} />
          <h1>{application.candidate?.full_name}</h1>
          <p>{application.job.title} | Applied {formatDate(application.created_at)}</p>
        </div>
        <a className="button button-secondary" href={`mailto:${application.candidate?.email}`}>
          Contact candidate
        </a>
      </header>
      {error ? <Feedback tone="error">{error}</Feedback> : null}
      {success ? <Feedback tone="success">{success}</Feedback> : null}

      <div className="admin-detail-grid">
        <div className="admin-detail-main">
          <section className="panel candidate-summary">
            <h2>Candidate profile</h2>
            <dl className="detail-definition-grid">
              <div><dt>Email</dt><dd>{application.candidate?.email}</dd></div>
              <div><dt>Phone</dt><dd>{application.candidate?.profile?.phone || "Not provided"}</dd></div>
              <div><dt>Location</dt><dd>{application.candidate?.profile?.current_city || "Not provided"}</dd></div>
              <div><dt>Current role</dt><dd>{application.candidate?.profile?.current_role || "Not provided"}</dd></div>
              <div><dt>Experience</dt><dd>{application.candidate?.profile?.total_experience_years ?? "Not provided"}</dd></div>
              <div><dt>Notice period</dt><dd>{application.candidate?.profile?.notice_period || "Not provided"}</dd></div>
            </dl>
            <div className="profile-links">
              {[
                ["LinkedIn", application.candidate?.profile?.linkedin_url],
                ["GitHub", application.candidate?.profile?.github_url],
                ["Portfolio", application.candidate?.profile?.portfolio_url],
              ].filter(([, href]) => href).map(([label, href]) => (
                <a href={href} target="_blank" rel="noreferrer" key={label}>{label}<ExternalLink size={15} /></a>
              ))}
            </div>
            <div className="skill-list">
              {application.candidate?.profile?.skills?.map((skill) => <span key={skill}>{skill}</span>)}
            </div>
          </section>

          <section className="panel">
            <h2>Application content</h2>
            <h3>Message</h3>
            <p>{application.cover_message || "No cover message included."}</p>
            {application.answers && Object.keys(application.answers).length ? (
              <div className="answer-list">
                {Object.entries(application.answers).map(([key, value]) => (
                  <div key={key}><strong>{humanize(key)}</strong><p>{String(value)}</p></div>
                ))}
              </div>
            ) : null}
            {application.resume ? (
              <div className="file-summary">
                <FileText size={22} />
                <span><strong>{application.resume.original_filename}</strong><small>Resume version {application.resume.version}</small></span>
              </div>
            ) : null}
          </section>

          <section className="panel">
            <h2>Activity timeline</h2>
            <ol className="timeline">
              {(application.events || []).map((event, index) => (
                <li key={`${event.event_type}-${event.created_at}`}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{event.new_status || humanize(event.event_type)}</strong>
                    {event.note ? <p>{event.note}</p> : null}
                    <small>{formatDate(event.created_at, true)}</small>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="panel">
            <h2>Internal notes</h2>
            <form className="inline-form" onSubmit={addNote}>
              <label><span>New note</span><textarea name="body" rows={4} required /></label>
              <button className="button button-secondary" disabled={saving}>Add note</button>
            </form>
            <div className="notes-list">
              {(application.notes || []).map((note) => (
                <article key={note.id}><p>{note.body}</p><small>{formatDate(note.created_at, true)}</small></article>
              ))}
            </div>
          </section>
        </div>

        <aside className="admin-actions-rail">
          <form className="panel sticky-panel" onSubmit={updateStatus}>
            <h2>Move application</h2>
            <label>
              <span>Internal status</span>
              <select name="internal_status" defaultValue={application.internal_status}>
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label><span>Candidate-visible note</span><textarea name="note" rows={3} /></label>
            <label><span>Rejection reason (internal)</span><select name="rejection_reason" defaultValue=""><option value="">Not applicable</option><option>Skills mismatch</option><option>Experience mismatch</option><option>Role fit</option><option>Stronger candidate selected</option><option>Incomplete application</option></select></label>
            <button className="button button-primary button-wide" disabled={saving}>Update status</button>
          </form>

          <form className="panel" onSubmit={assign}>
            <h2><UserPlus size={19} /> Assign reviewer</h2>
            <select name="reviewer_id" required defaultValue="">
              <option value="" disabled>Select reviewer</option>
              {reviewers.map((reviewer) => <option value={reviewer.id} key={reviewer.id}>{reviewer.full_name}</option>)}
            </select>
            <button className="button button-secondary button-wide" disabled={saving}>Assign</button>
          </form>

          <Link className="panel quick-action" href={`/admin/interviews?application=${application.id}`}>
            <CalendarPlus size={20} />
            <span><strong>Schedule interview</strong><small>Create an invitation for this candidate.</small></span>
          </Link>
        </aside>
      </div>
    </>
  );
}
