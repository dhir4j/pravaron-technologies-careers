"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ExternalLink, ListChecks, Plus, Trash2, Video } from "lucide-react";
import { LoadingBlock, EmptyState, Feedback, StatusBadge, PageIntro } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { AIInterview, Application } from "@/lib/types";

const RECOMMENDATION_COLOR: Record<string, string> = {
  Proceed: "var(--success)",
  Hold: "var(--warning)",
  Reject: "var(--danger)",
};

const RECOMMENDATION_BG: Record<string, string> = {
  Proceed: "var(--success-soft)",
  Hold: "var(--warning-soft)",
  Reject: "var(--danger-soft)",
};

export function AdminAIInterviews() {
  const [interviews, setInterviews] = useState<AIInterview[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleSuccess, setScheduleSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [interviewData, appData] = await Promise.all([
        api<{ interviews: AIInterview[]; total: number }>("/admin/interviews/ai"),
        api<{ applications: Application[] }>("/admin/applications?status=Shortlisted"),
      ]);
      setInterviews(interviewData.interviews);
      setApplications(appData.applications);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load interview scheduling");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteInterview = async (id: string) => {
    if (!window.confirm("Delete this interview record? This removes the scheduled/completed interview and lets you schedule again.")) return;
    try {
      await api(`/admin/interviews/ai/${id}`, { method: "DELETE" });
      setInterviews(prev => prev.filter(i => i.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete interview");
    }
  };

  const scheduleInterview = async () => {
    if (!selectedApplicationId) { setScheduleError("Please select an application"); return; }
    setScheduling(true);
    setScheduleError("");
    setScheduleSuccess("");
    try {
      await api("/admin/interviews/ai", { method: "POST", body: { application_id: selectedApplicationId } });
      setSelectedApplicationId("");
      setScheduleSuccess("MCQ interview scheduled. Job-specific setup questions will be used when the candidate starts.");
      load();
    } catch (e: unknown) {
      setScheduleError(e instanceof Error ? e.message : "Failed to schedule interview");
    } finally {
      setScheduling(false);
    }
  };

  if (loading) return <LoadingBlock label="Loading interview scheduling" />;
  if (error) return <Feedback tone="error">{error}</Feedback>;

  const awaitingCount = interviews.filter(i => i.status === "scheduled" || i.status === "identity_verified").length;
  const inProgressCount = interviews.filter(i => i.status === "in_progress").length;
  const completedCount = interviews.filter(i => i.status === "completed" || i.status === "reviewed").length;

  return (
    <>
      <PageIntro
        eyebrow="Round one"
        title="Interview scheduling"
        body="Schedule shortlisted candidates for the secured MCQ round and open live sessions for monitoring."
      />

      <div className="ai-list-metrics ai-list-metrics-admin" aria-label="Interview status summary">
        <div><span>Awaiting candidate</span><strong>{awaitingCount}</strong></div>
        <div><span>Live now</span><strong>{inProgressCount}</strong></div>
        <div><span>Task done</span><strong>{completedCount}</strong></div>
      </div>

      <section className="ai-schedule-panel">
        <div className="ai-schedule-heading">
          <div className="ai-interview-card-icon"><ListChecks size={17} /></div>
          <div>
            <h2>Schedule MCQ interview</h2>
            <p>Select a shortlisted application. Setup questions are managed from the Interviews page.</p>
          </div>
        </div>
        <div className="ai-schedule-form">
          <label>
            <span>Select shortlisted candidate</span>
            <select value={selectedApplicationId} onChange={(event) => setSelectedApplicationId(event.target.value)}>
              <option value="">Choose a shortlisted candidate</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>{app.candidate?.full_name ?? "Unknown"} - {app.job?.title ?? "Unknown role"} ({app.candidate?.email})</option>
              ))}
              {applications.length === 0 ? <option disabled value="">No shortlisted applications found</option> : null}
            </select>
          </label>
          <button className="button button-primary" onClick={scheduleInterview} disabled={scheduling || !selectedApplicationId}><Plus size={14} />{scheduling ? "Scheduling" : "Schedule interview"}</button>
        </div>
        {scheduleError ? <Feedback tone="error">{scheduleError}</Feedback> : null}
        {scheduleSuccess ? <Feedback tone="success">{scheduleSuccess}</Feedback> : null}
      </section>

      <div className="ai-section-heading">
        <h2>Interview sessions</h2>
        <span>{interviews.length} total</span>
      </div>

      {interviews.length === 0 ? (
        <EmptyState title="No interviews yet" body="Schedule a first-round MCQ interview for a shortlisted application to get started." />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Candidate</th><th>Status</th><th>Questions</th><th>Duration</th><th>Score</th><th>Recommendation</th><th>Scheduled</th><th></th></tr>
            </thead>
            <tbody>
              {interviews.map((interview) => (
                <tr key={interview.id}>
                  <td><div style={{ fontWeight: 700, fontSize: 13 }}>{interview.candidate_name ?? "Unknown"}</div>{interview.candidate_email ? <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{interview.candidate_email}</div> : null}<div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{interview.job_title}</div></td>
                  <td><StatusBadge value={interview.status === "in_progress" ? "live" : interview.status === "completed" || interview.status === "reviewed" ? "task done" : interview.status} /></td>
                  <td style={{ fontSize: 13 }}>{interview.question_count}</td>
                  <td style={{ fontSize: 13 }}>{interview.total_duration_seconds ? `${Math.round(interview.total_duration_seconds / 60)} min` : "Not submitted"}</td>
                  <td style={{ fontSize: 13, fontWeight: 800 }}>{interview.ai_scores?.score_out_of_100 != null ? `${interview.ai_scores.score_out_of_100}/100` : interview.ai_scores?.overall != null ? `${interview.ai_scores.overall}/10` : "Pending"}</td>
                  <td>{interview.recommendation ? <span style={{ fontWeight: 700, fontSize: 12, color: RECOMMENDATION_COLOR[interview.recommendation] ?? "var(--ink)", background: RECOMMENDATION_BG[interview.recommendation] ?? "var(--surface)", padding: "3px 8px", borderRadius: 4 }}>{interview.recommendation}</span> : <span style={{ fontSize: 12, color: "var(--muted)" }}>Pending</span>}</td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{formatDate(interview.created_at)}</td>
                  <td><div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end" }}><Link className="button button-secondary button-small" href={`/admin/interviews/ai/${interview.id}`}>{interview.status === "in_progress" ? <Video size={13} /> : <ExternalLink size={13} />} {interview.status === "in_progress" ? "Watch live" : "Review"}</Link><button className="button button-small" style={{ color: "var(--danger)", borderColor: "rgba(174,31,24,.3)", background: "var(--danger-soft)", gap: 5 }} onClick={() => deleteInterview(interview.id)} title="Delete this interview"><Trash2 size={13} /> Delete</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
