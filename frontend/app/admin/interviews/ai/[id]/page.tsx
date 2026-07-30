"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Camera, CheckCircle2, MessageSquare, ShieldCheck, Trash2 } from "lucide-react";
import { LoadingBlock, Feedback, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate, humanize } from "@/lib/format";
import type { AIInterview, AIInterviewQuestion } from "@/lib/types";

const RECOMMENDATION_COLOR: Record<string, string> = {
  Proceed: "var(--success)",
  Hold: "var(--warning)",
  Reject: "var(--danger)",
};

type LiveState = {
  latest_frame_data_url?: string;
  latest_frame_at?: string;
  proctoring_summary?: Record<string, number>;
  security_events?: AIInterview["security_events"];
  admin_messages?: AIInterview["admin_messages"];
};

function scoreWidth(value: number, suffix: string) {
  if (suffix === "/100" || suffix === "%") return value;
  if (suffix === " pts") return Math.min(100, value * 3.33);
  return value * 10;
}

function AIInterviewDetail({ id }: { id: string }) {
  const router = useRouter();
  const [interview, setInterview] = useState<AIInterview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [recommendation, setRecommendation] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [live, setLive] = useState<LiveState | null>(null);
  const [adminMessage, setAdminMessage] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<{ interview: AIInterview }>(`/admin/interviews/ai/${id}`);
      setInterview(data.interview);
      setReviewerNotes(data.interview.reviewer_notes ?? "");
      setRecommendation(data.interview.recommendation ?? "");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load interview");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadLive = useCallback(async () => {
    try {
      const data = await api<LiveState>(`/admin/interviews/ai/${id}/live`);
      setLive(data);
    } catch {}
  }, [id]);

  useEffect(() => { load(); loadLive(); }, [load, loadLive]);

  useEffect(() => {
    if (!interview) return;
    const intervalMs = interview.status === "in_progress" ? 2500 : 9000;
    pollRef.current = setInterval(() => { load(); loadLive(); }, intervalMs);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [interview?.status, load, loadLive, interview]);

  const sendMessage = async () => {
    const message = adminMessage.trim();
    if (!message) return;
    try {
      const data = await api<{ messages: AIInterview["admin_messages"] }>(`/admin/interviews/ai/${id}/messages`, {
        method: "POST",
        body: { message },
      });
      setLive(current => ({ ...(current ?? {}), admin_messages: data.messages }));
      setAdminMessage("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send message");
    }
  };

  const submitReview = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const data = await api<{ interview: AIInterview }>(`/admin/interviews/ai/${id}/review`, {
        method: "PATCH",
        body: { reviewer_notes: reviewerNotes, recommendation },
      });
      setInterview(data.interview);
      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save review");
    } finally {
      setSaving(false);
    }
  };

  const deleteInterview = async () => {
    if (!window.confirm("Delete this interview record? This removes the session and lets you schedule again.")) return;
    setDeleting(true);
    try {
      await api(`/admin/interviews/ai/${id}`, { method: "DELETE" });
      router.push("/admin/interviews/ai");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete interview");
      setDeleting(false);
    }
  };

  if (loading) return <LoadingBlock label="Loading interview" />;
  if (error && !interview) return <Feedback tone="error">{error}</Feedback>;
  if (!interview) return <Feedback tone="error">Interview not found</Feedback>;

  const scores = interview.ai_scores;
  const isLive = interview.status === "in_progress";
  const isTaskDone = interview.status === "completed" || interview.status === "reviewed";
  const statusLabel = isLive ? "live" : isTaskDone ? "task done" : interview.status;
  const summary = live?.proctoring_summary ?? interview.proctoring_summary ?? {};
  const events = live?.security_events ?? interview.security_events ?? [];
  const scoreCards = [
    ["Final score", scores?.score_out_of_100, "/100"],
    ["Overall", scores?.overall, "/10"],
    ["Raw MCQ", scores?.raw_overall, "/10"],
    ["Aptitude", scores?.aptitude, "/10"],
    ["GK", scores?.gk, "/10"],
    ["Technical", scores?.technical, "/10"],
    ["Security", scores?.security, "/10"],
    ["Security penalty", scores?.security_penalty, " pts"],
    ["Completion", scores?.completion_rate, "%"],
  ].filter(([, value]) => value != null) as Array<[string, number, string]>;

  return (
    <>
      <Link className="back-link" href="/admin/interviews/ai"><ArrowLeft size={16} /> Schedule Interview</Link>

      <div className="interview-review-head">
        <div>
          <h1>MCQ interview monitor</h1>
          <div>
            <StatusBadge value={statusLabel} />
            {isLive ? <span className="live-chip"><span />LIVE - auto-refreshing</span> : null}
            {isTaskDone ? <span className="done-chip"><CheckCircle2 size={13} />Task done</span> : null}
            {interview.candidate_name ? <strong>{interview.candidate_name}</strong> : null}
            <span>{interview.question_count} questions</span>
            {interview.total_duration_seconds ? <span>{Math.round(interview.total_duration_seconds / 60)} min</span> : null}
            {interview.completed_at ? <span>Completed {formatDate(interview.completed_at)}</span> : null}
          </div>
        </div>
        <div className="interview-review-actions">
          {interview.recommendation ? <strong style={{ color: RECOMMENDATION_COLOR[interview.recommendation] }}>{interview.recommendation}</strong> : null}
          <button className="button button-small" style={{ color: "var(--danger)", borderColor: "rgba(174,31,24,.3)", background: "var(--danger-soft)" }} onClick={deleteInterview} disabled={deleting}>
            <Trash2 size={14} /> {deleting ? "Deleting..." : "Delete interview"}
          </button>
        </div>
      </div>

      {!isTaskDone ? (
        <div className="interview-active-note">
          <strong>{isLive ? "MCQ interview live." : "Awaiting candidate."}</strong>
          <span>{isLive ? "You can monitor the camera preview, security events, and send messages." : "You can delete this invite and schedule a new one if needed."}</span>
        </div>
      ) : null}

      <section className="panel live-monitor-panel">
        <div className="live-monitor-head">
          <div>
            <h2><Camera size={18} /> Live security monitor</h2>
            <p>{isLive ? "Candidate is live. This view refreshes every few seconds." : isTaskDone ? "Task done. Review the final score, responses, and security evidence." : "Latest proctoring data from the candidate session."}</p>
          </div>
          <StatusBadge value={statusLabel} />
        </div>
        <div className="live-monitor-grid">
          <div className="live-frame-box">
            {live?.latest_frame_data_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={live.latest_frame_data_url} alt="Latest candidate camera frame" />
            ) : (
              <div><Camera size={28} /><span>No live frame yet</span></div>
            )}
            <small>{live?.latest_frame_at ? `Last frame ${formatDate(live.latest_frame_at, true)}` : "Waiting for candidate camera"}</small>
          </div>
          <div className="live-security-box">
            <div className="live-security-score"><ShieldCheck size={18} /><span>Suspicion score</span><strong>{summary.suspicious_total ?? 0}</strong></div>
            <div className="live-security-metrics">
              {[["Tab switches", "tab_switches"], ["Focus losses", "focus_losses"], ["Fullscreen exits", "fullscreen_exits"], ["Copy/paste", "copy_paste_events"], ["No face", "face_not_detected"], ["Multiple faces", "multiple_faces"], ["Phone/object", "mobile_detected"], ["Look away", "look_away"]].map(([label, key]) => (
                <div key={key}><span>{label}</span><strong>{summary[key] ?? 0}</strong></div>
              ))}
            </div>
          </div>
        </div>
        <div className="live-admin-message">
          <label>
            <span>Message candidate</span>
            <div><input value={adminMessage} onChange={(event) => setAdminMessage(event.target.value)} placeholder="Short instruction shown in candidate corner" maxLength={500} /><button className="button button-secondary button-small" onClick={sendMessage} disabled={!adminMessage.trim()}><MessageSquare size={14} /> Send</button></div>
          </label>
        </div>
        <div className="live-event-list">
          {events.slice(-8).reverse().map((event) => <div key={event.id} className={`live-event ${event.severity}`}><AlertTriangle size={14} /><span>{event.description}</span><small>{formatDate(event.occurred_at, true)}</small></div>)}
        </div>
      </section>

      {scoreCards.length > 0 ? (
        <div className="ai-score-grid" style={{ marginBottom: 24 }}>
          {scoreCards.map(([label, val, suffix]) => <div key={label} className="ai-score-card"><div className="ai-score-label">{label}</div><div className="ai-score-value">{val}{suffix}</div><div className="ai-score-bar"><div className="ai-score-fill" style={{ width: `${Math.max(0, Math.min(100, scoreWidth(val, suffix)))}%` }} /></div></div>)}
        </div>
      ) : null}

      {interview.ai_summary ? (
        <div className="panel" style={{ padding: "22px 28px", marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Platform AI result</h2>
          {interview.ai_summary.overall ? <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>{interview.ai_summary.overall}</p> : null}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {interview.ai_summary.strengths?.length ? <div><div className="ai-score-label" style={{ color: "var(--success)" }}>Strengths</div><ul>{interview.ai_summary.strengths.map((item, index) => <li key={index}>{item}</li>)}</ul></div> : null}
            {interview.ai_summary.concerns?.length ? <div><div className="ai-score-label" style={{ color: "var(--danger)" }}>Concerns</div><ul>{interview.ai_summary.concerns.map((item, index) => <li key={index}>{item}</li>)}</ul></div> : null}
          </div>
        </div>
      ) : null}

      <div className="panel" style={{ padding: "22px 28px", marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>MCQ response log</h2>
        {(interview.questions ?? []).length === 0 ? <p style={{ color: "var(--muted)", fontSize: 14 }}>No questions have been submitted yet.</p> : (
          <div>{(interview.questions ?? []).map((q: AIInterviewQuestion, i: number) => <div key={q.id} className="transcript-qa"><div className="transcript-question"><span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--accent)", marginRight: 8 }}>Q{i + 1} - {humanize(q.category ?? q.question_type)}</span>{q.content}</div><div className={`transcript-answer${!q.response?.response_text ? " empty" : ""}`}>{q.response?.response_text ? q.response.response_text : "No answer submitted"}{q.correct_answer ? <span style={{ display: "block", fontSize: 12, color: q.response?.is_correct ? "var(--success)" : "var(--danger)", marginTop: 6 }}>Correct answer: {q.correct_answer}</span> : null}</div></div>)}</div>
        )}
      </div>

      <div className="panel" style={{ padding: "22px 28px", maxWidth: 600 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Human review</h2>
        <div style={{ marginBottom: 14 }}><label className="field-label">Recommendation</label><select value={recommendation} onChange={(e) => setRecommendation(e.target.value)} style={{ maxWidth: 200 }}><option value="">Select</option><option value="Proceed">Proceed</option><option value="Hold">Hold</option><option value="Reject">Reject</option></select></div>
        <div style={{ marginBottom: 16 }}><label className="field-label">Reviewer notes</label><textarea rows={4} value={reviewerNotes} onChange={(e) => setReviewerNotes(e.target.value)} placeholder="Add notes on MCQ performance and security evidence" /></div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}><button className="button button-primary" onClick={submitReview} disabled={saving}>{saving ? "Saving..." : "Submit review"}</button>{saved ? <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 700 }}>Saved</span> : null}</div>
        {error ? <div style={{ marginTop: 12 }}><Feedback tone="error">{error}</Feedback></div> : null}
      </div>
    </>
  );
}

export default function AdminAIInterviewDetailPage() {
  const params = useParams();
  return <AIInterviewDetail id={params.id as string} />;
}
