"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate, humanize } from "@/lib/format";
import type { Interview, User } from "@/lib/types";
import { EmptyState, Feedback, LoadingBlock, PageIntro, StatusBadge } from "@/components/ui";

export function CandidateDirectory() {
  const [items, setItems] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<{ candidates: User[] }>("/admin/candidates")
      .then((response) => setItems(response.candidates))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <LoadingBlock label="Loading candidates" />;
  return (
    <>
      <PageIntro title="Candidates" body="Review candidate accounts and profile readiness." />
      {error ? <Feedback tone="error">{error}</Feedback> : null}
      {items.length ? (
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Candidate</th><th>Location</th><th>Current role</th><th>Skills</th><th>Joined</th></tr></thead><tbody>
          {items.map((candidate) => <tr key={candidate.id}><td><strong>{candidate.full_name}</strong><small>{candidate.email}</small></td><td>{candidate.profile?.current_city || "Not provided"}</td><td>{candidate.profile?.current_role || "Not provided"}</td><td>{candidate.profile?.skills?.slice(0, 3).join(", ") || "Not provided"}</td><td>{formatDate(candidate.created_at)}</td></tr>)}
        </tbody></table></div>
      ) : <EmptyState title="No candidate accounts" body="Registered candidates will appear here." />}
    </>
  );
}

export function InterviewManager({ initialApplicationId = "" }: { initialApplicationId?: string }) {
  const [items, setItems] = useState<Interview[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    api<{ interviews: Interview[] }>("/admin/interviews")
      .then((response) => setItems(response.interviews))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function schedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await api("/admin/interviews", {
        method: "POST",
        body: {
          application_id: data.get("application_id"),
          interview_type: data.get("interview_type"),
          starts_at: data.get("starts_at"),
          ends_at: data.get("ends_at"),
          timezone: data.get("timezone"),
          meeting_mode: data.get("meeting_mode"),
          meeting_link: data.get("meeting_link"),
          physical_location: data.get("physical_location"),
          candidate_instructions: data.get("candidate_instructions"),
        },
      });
      setSuccess("Interview scheduled and candidate notification created.");
      form.reset();
      load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Scheduling failed");
    }
  }

  if (loading) return <LoadingBlock label="Loading interviews" />;
  return (
    <>
      <PageIntro title="Interviews" body="Schedule candidate conversations and manage invitations." />
      {error ? <Feedback tone="error">{error}</Feedback> : null}
      {success ? <Feedback tone="success">{success}</Feedback> : null}
      <div className="directory-grid">
        <form className="panel interview-form" onSubmit={schedule}>
          <h2>Schedule interview</h2>
          <label><span>Application ID</span><input name="application_id" defaultValue={initialApplicationId} required /></label>
          <label><span>Interview type</span><select name="interview_type"><option>Screening Call</option><option>Technical Interview</option><option>Managerial Interview</option><option>HR Discussion</option><option>Final Discussion</option></select></label>
          <div className="form-grid">
            <label><span>Starts at</span><input type="datetime-local" name="starts_at" required /></label>
            <label><span>Ends at</span><input type="datetime-local" name="ends_at" required /></label>
            <label><span>Timezone</span><input name="timezone" defaultValue="Asia/Kolkata" required /></label>
            <label><span>Meeting mode</span><select name="meeting_mode"><option>Video</option><option>Phone</option><option>On-site</option></select></label>
          </div>
          <label><span>Meeting link</span><input type="url" name="meeting_link" /></label>
          <label><span>Physical location</span><input name="physical_location" /></label>
          <label><span>Candidate instructions</span><textarea name="candidate_instructions" rows={4} /></label>
          <button className="button button-primary">Schedule interview</button>
        </form>
        <section className="panel">
          <h2>Scheduled interviews</h2>
          <div className="interview-list">
            {items.map((interview) => (
              <article key={interview.id}>
                <StatusBadge value={interview.status} />
                <strong>{interview.interview_type}</strong>
                <span>{formatDate(interview.starts_at, true)}</span>
                <small>{interview.meeting_mode} | {interview.timezone}</small>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export function TeamAccess() {
  const [items, setItems] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  function load() {
    api<{ users: User[] }>("/admin/users")
      .then((response) => setItems(response.users))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await api("/admin/users", { method: "POST", body: Object.fromEntries(data) });
      setSuccess("Team account created.");
      form.reset();
      load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Account creation failed");
    }
  }
  if (loading) return <LoadingBlock label="Loading team access" />;
  return (
    <>
      <PageIntro title="Team access" body="Create hiring team and reviewer accounts with scoped roles." />
      {error ? <Feedback tone="error">{error}</Feedback> : null}
      {success ? <Feedback tone="success">{success}</Feedback> : null}
      <div className="directory-grid">
        <form className="panel" onSubmit={create}>
          <h2>Create team account</h2>
          <label><span>Full name</span><input name="full_name" required /></label>
          <label><span>Email</span><input type="email" name="email" required /></label>
          <label><span>Temporary password</span><input type="password" name="password" minLength={8} required /></label>
          <label><span>Role</span><select name="role"><option value="people_ops_admin">People Ops Admin</option><option value="hiring_manager">Hiring Manager</option><option value="technical_reviewer">Technical Reviewer</option><option value="read_only_reviewer">Read Only Reviewer</option></select></label>
          <button className="button button-primary">Create account</button>
        </form>
        <section className="panel">
          <h2>Current access</h2>
          <div className="team-list">
            {items.filter((user) => user.role !== "candidate").map((user) => (
              <article key={user.id}><span><strong>{user.full_name}</strong><small>{user.email}</small></span><StatusBadge value={humanize(user.role)} /></article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
