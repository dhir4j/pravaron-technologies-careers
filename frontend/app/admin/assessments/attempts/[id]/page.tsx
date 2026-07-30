"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, ShieldCheck } from "lucide-react";
import { LoadingBlock, Feedback, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import type { AssessmentAttempt, ProctoringSession, User, ProctoringEvent } from "@/lib/types";
import { formatDate } from "@/lib/format";

function AttemptDetail({ id }: { id: string }) {
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [proctoring, setProctoring] = useState<ProctoringSession | null>(null);
  const [candidate, setCandidate] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [graderNotes, setGraderNotes] = useState("");
  const [manualGrades, setManualGrades] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [reviewingEvent, setReviewingEvent] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ attempt: AssessmentAttempt; proctoring: ProctoringSession | null; candidate: User | null }>(`/admin/assessments/attempts/${id}`);
      setAttempt(data.attempt);
      setProctoring(data.proctoring);
      setCandidate(data.candidate);
      setGraderNotes(data.attempt.grader_notes ?? "");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const submitGrades = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const response_grades = Object.entries(manualGrades).map(([response_id, manual_marks]) => ({
        response_id,
        manual_marks,
        reviewer_comment: "",
      }));
      const data = await api<{ attempt: AssessmentAttempt }>(`/admin/assessments/attempts/${id}/grade`, {
        method: "PATCH",
        body: { response_grades, grader_notes: graderNotes },
      });
      setAttempt(data.attempt);
      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save grades");
    } finally {
      setSaving(false);
    }
  };

  const reviewEvent = async (eventId: string) => {
    try {
      await api(`/admin/assessments/proctoring/events/${eventId}/review`, {
        method: "PATCH",
        body: { reviewer_note: reviewNotes[eventId] ?? "" },
      });
      setProctoring(prev => prev ? {
        ...prev,
        events: (prev.events ?? []).map(e => e.id === eventId ? { ...e, reviewed: true, reviewer_note: reviewNotes[eventId] ?? "" } : e),
      } : prev);
      setReviewingEvent(null);
    } catch {
      // ignore
    }
  };

  if (loading) return <LoadingBlock label="Loading attempt" />;
  if (error) return <Feedback tone="error">{error}</Feedback>;
  if (!attempt) return <Feedback tone="error">Attempt not found</Feedback>;

  const needsManualGrading = (attempt.responses ?? []).some(r => ["text", "code", "file_upload"].includes(r.question?.question_type ?? ""));
  const severityColor = (s: string) => s === "high" ? "var(--danger)" : s === "medium" ? "var(--warning)" : "var(--muted)";

  return (
    <>
      <Link className="back-link" href={`/admin/assessments/${attempt.assessment_id}/results`}><ArrowLeft size={16} /> Results</Link>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Attempt Review</h1>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            {candidate?.full_name ?? "Candidate"} · {candidate?.email} · <StatusBadge value={attempt.status} />
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          {attempt.final_score != null && (
            <>
              <div style={{ fontSize: 32, fontWeight: 900 }}>{attempt.percentage}%</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Score: {attempt.final_score} marks</div>
              {attempt.is_passed != null && (
                <div style={{ fontWeight: 700, color: attempt.is_passed ? "var(--success)" : "var(--danger)", fontSize: 14 }}>
                  {attempt.is_passed ? "Passed" : "Failed"}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {proctoring && (
        <div className="panel" style={{ padding: "20px 24px", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            {proctoring.suspicious_total > 5 ? <AlertTriangle size={18} style={{ color: "var(--warning)" }} /> : <ShieldCheck size={18} style={{ color: "var(--success)" }} />}
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Proctoring Report</h2>
            <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: proctoring.suspicious_total > 10 ? "var(--danger)" : "var(--muted)" }}>
              Suspicion score: {proctoring.suspicious_total}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            {[
              ["Fullscreen exits", proctoring.fullscreen_exits],
              ["Tab switches", proctoring.tab_switches],
              ["Focus losses", proctoring.focus_losses],
              ["Copy/paste events", proctoring.copy_paste_events],
              ["Face not detected", proctoring.face_not_detected_count],
              ["Multiple faces", proctoring.multiple_faces_count],
              ["Mobile detected", proctoring.mobile_detected_count],
            ].map(([label, count]) => (
              <div key={String(label)} style={{ background: "var(--surface)", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: Number(count) > 0 ? "var(--warning)" : "var(--ink)" }}>{count}</div>
              </div>
            ))}
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Event Timeline</h3>
          {(proctoring.events ?? []).length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--muted)" }}>No events recorded.</p>
          ) : (
            <div>
              {(proctoring.events ?? []).map((event: ProctoringEvent) => (
                <div key={event.id} className="proctoring-event-item">
                  <div className={`proctoring-event-icon ${event.severity}`}>
                    <AlertTriangle size={12} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{event.event_type.replace(/_/g, " ")}</div>
                    <div style={{ fontSize: 12, color: severityColor(event.severity) }}>{event.severity} severity · {formatDate(event.occurred_at)}</div>
                    {event.description && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{event.description}</div>}
                  </div>
                  {event.reviewed ? (
                    <span style={{ fontSize: 11, color: "var(--success)", fontWeight: 700 }}>Reviewed</span>
                  ) : (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {reviewingEvent === event.id ? (
                        <>
                          <input className="field" style={{ width: 180 }} placeholder="Reviewer note…" value={reviewNotes[event.id] ?? ""} onChange={(e) => setReviewNotes(p => ({ ...p, [event.id]: e.target.value }))} />
                          <button className="button button-primary button-small" onClick={() => reviewEvent(event.id)}>Save</button>
                          <button className="button button-ghost button-small" onClick={() => setReviewingEvent(null)}>Cancel</button>
                        </>
                      ) : (
                        <button className="button button-secondary button-small" onClick={() => setReviewingEvent(event.id)}>Review</button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Responses</h2>
        {(attempt.responses ?? []).map((response, i) => {
          const q = response.question;
          if (!q) return null;
          const needsManual = ["text", "code", "file_upload"].includes(q.question_type);
          return (
            <div key={response.id} className="question-card">
              <div className="question-card-header">
                <div className="question-number">{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div className="question-content" style={{ marginBottom: 4 }}>{q.content}</div>
                  <div style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--muted)" }}>
                    <span className="question-type-badge">{q.question_type}</span>
                    <span>{q.marks} mark{q.marks !== 1 ? "s" : ""}</span>
                    {response.is_correct === true && <span style={{ color: "var(--success)", fontWeight: 700 }}>✓ Correct</span>}
                    {response.is_correct === false && <span style={{ color: "var(--danger)", fontWeight: 700 }}>✗ Incorrect</span>}
                  </div>
                </div>
              </div>
              <div style={{ background: "var(--surface)", borderRadius: 6, padding: "14px 18px", marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.08em", marginBottom: 8 }}>Candidate answer</div>
                {response.response == null ? (
                  <span style={{ color: "var(--faint)", fontStyle: "italic", fontSize: 14 }}>No answer provided</span>
                ) : q.question_type === "code" ? (
                  <pre style={{ fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap", margin: 0 }}>{String(response.response)}</pre>
                ) : (
                  <p style={{ fontSize: 14, margin: 0, whiteSpace: "pre-wrap" }}>{Array.isArray(response.response) ? (response.response as string[]).join(", ") : String(response.response)}</p>
                )}
              </div>
              {q.correct_answer != null && !needsManual && (
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
                  Correct answer: <strong>{Array.isArray(q.correct_answer) ? (q.correct_answer as string[]).join(", ") : String(q.correct_answer)}</strong>
                </div>
              )}
              {needsManual && (
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
                  <label className="field-label" style={{ margin: 0 }}>Manual marks:</label>
                  <input
                    className="field"
                    type="number"
                    min={0}
                    max={q.marks}
                    style={{ width: 80 }}
                    value={manualGrades[response.id] ?? (response.manual_marks ?? "")}
                    onChange={(e) => setManualGrades(p => ({ ...p, [response.id]: parseFloat(e.target.value) || 0 }))}
                  />
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>/ {q.marks}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {needsManualGrading && (
        <div className="panel" style={{ padding: "20px 24px", maxWidth: 600 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Submit Manual Grades</h3>
          <div style={{ marginBottom: 14 }}>
            <label className="field-label">Grader notes</label>
            <textarea className="field" rows={3} value={graderNotes} onChange={(e) => setGraderNotes(e.target.value)} placeholder="Optional notes for graders and recruiters…" />
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="button button-primary" onClick={submitGrades} disabled={saving}>
              {saving ? "Saving grades…" : "Submit grades"}
            </button>
            {saved && <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 700 }}>Grades saved!</span>}
          </div>
          {error && <Feedback tone="error">{error}</Feedback>}
        </div>
      )}
    </>
  );
}

export default function AttemptPage() {
  const params = useParams();
  return <AttemptDetail id={params.id as string} />;
}
