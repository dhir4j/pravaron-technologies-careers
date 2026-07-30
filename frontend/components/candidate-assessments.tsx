"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ClipboardList, Clock, CheckCircle, XCircle, AlertCircle, Play } from "lucide-react";
import { LoadingBlock, EmptyState, Feedback, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { AssessmentAttempt } from "@/lib/types";

interface AssignedAssessment {
  attempt: AssessmentAttempt;
  assessment_title: string;
  assessment_type: string;
  time_limit_minutes: number;
  pass_score: number;
  total_marks: number;
  instructions?: string;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "graded") return <CheckCircle size={16} style={{ color: "var(--success)" }} />;
  if (status === "timed_out") return <AlertCircle size={16} style={{ color: "var(--danger)" }} />;
  if (status === "submitted") return <Clock size={16} style={{ color: "var(--warning)" }} />;
  if (status === "in_progress") return <Play size={16} style={{ color: "var(--accent)" }} />;
  return <XCircle size={16} style={{ color: "var(--muted)" }} />;
}

export function CandidateAssessments() {
  const [assignments, setAssignments] = useState<AssignedAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ assessments: AssignedAssessment[] }>("/candidate/assessments");
      setAssignments(data.assessments);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load assessments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingBlock label="Loading assessments" />;
  if (error) return <Feedback tone="error">{error}</Feedback>;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <ClipboardList size={24} />
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Assessments</h1>
      </div>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 28 }}>
        Complete assigned assessments to advance your application.
      </p>

      {assignments.length === 0 ? (
        <EmptyState title="No assessments assigned" body="No assessments have been assigned to your applications yet." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {assignments.map(({ attempt, assessment_title, assessment_type, time_limit_minutes, pass_score, total_marks, instructions }) => {
            const canStart = attempt.status === "not_started";
            const canContinue = attempt.status === "in_progress";
            const isDone = ["submitted", "timed_out", "graded"].includes(attempt.status);

            return (
              <div key={attempt.id} className="panel" style={{ padding: "22px 28px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <StatusIcon status={attempt.status} />
                      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{assessment_title}</h2>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)", background: "rgba(var(--accent-rgb),0.1)", padding: "2px 8px", borderRadius: 4 }}>
                        {assessment_type}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
                      <span><Clock size={12} style={{ marginRight: 4 }} />{time_limit_minutes} min</span>
                      <span>Pass: {pass_score}%</span>
                      <span>{total_marks} marks</span>
                      {attempt.expires_at && attempt.status === "in_progress" && (
                        <span style={{ color: "var(--warning)", fontWeight: 700 }}>
                          Expires: {formatDate(attempt.expires_at, true)}
                        </span>
                      )}
                    </div>
                    {instructions && (
                      <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.5, maxWidth: 640 }}>{instructions}</p>
                    )}
                    {isDone && attempt.percentage != null && (
                      <div style={{ marginTop: 10, display: "flex", gap: 16, alignItems: "center" }}>
                        <span style={{ fontWeight: 700, fontSize: 20, color: (attempt.percentage >= pass_score) ? "var(--success)" : "var(--danger)" }}>
                          {attempt.percentage}%
                        </span>
                        <span style={{ fontSize: 13, color: "var(--muted)" }}>
                          {attempt.final_score} / {total_marks} marks
                        </span>
                        {attempt.is_passed != null && (
                          <StatusBadge value={attempt.is_passed ? "passed" : "failed"} />
                        )}
                      </div>
                    )}
                    {attempt.status === "submitted" && (
                      <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 10 }}>
                        Submitted {attempt.submitted_at ? formatDate(attempt.submitted_at) : ""} — awaiting grading.
                      </p>
                    )}
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {canStart && (
                      <Link className="button button-primary" href={`/candidate/assessments/${attempt.id}`}>
                        Start Assessment
                      </Link>
                    )}
                    {canContinue && (
                      <Link className="button button-warning" href={`/candidate/assessments/${attempt.id}`}>
                        Continue Assessment
                      </Link>
                    )}
                    {isDone && (
                      <StatusBadge value={attempt.status} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
