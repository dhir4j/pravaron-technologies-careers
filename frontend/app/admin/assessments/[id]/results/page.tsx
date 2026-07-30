"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { LoadingBlock, EmptyState, Feedback, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import type { Assessment, AssessmentAttempt } from "@/lib/types";
import { formatDate } from "@/lib/format";

function ResultsContent({ id }: { id: string }) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        api<{ assessment: Assessment }>(`/admin/assessments/${id}`),
        api<{ attempts: AssessmentAttempt[]; total: number }>(`/admin/assessments/${id}/attempts`),
      ]);
      setAssessment(a.assessment);
      setAttempts(b.attempts);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingBlock label="Loading results" />;
  if (error) return <Feedback tone="error">{error}</Feedback>;

  const passed = attempts.filter(a => a.is_passed).length;
  const submitted = attempts.filter(a => ["submitted", "graded", "timed_out"].includes(a.status)).length;

  return (
    <>
      <Link className="back-link" href={`/admin/assessments/${id}`}><ArrowLeft size={16} /> {assessment?.title}</Link>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Results</h1>
      <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 28 }}>{attempts.length} attempt{attempts.length !== 1 ? "s" : ""} · {submitted} submitted · {passed} passed</p>

      {attempts.length === 0 ? (
        <EmptyState title="No attempts yet" body="No candidates have taken this assessment yet. Assign it to applications first." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Status</th>
                <th>Score</th>
                <th>%</th>
                <th>Result</th>
                <th>Started</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td style={{ fontSize: 13 }}>{attempt.candidate_id}</td>
                  <td><StatusBadge value={attempt.status} /></td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 14 }}>
                    {attempt.final_score != null ? `${attempt.final_score} / ${assessment?.total_marks}` : "—"}
                  </td>
                  <td style={{ fontWeight: 700, color: (attempt.percentage ?? 0) >= (assessment?.pass_score ?? 60) ? "var(--success)" : "var(--danger)" }}>
                    {attempt.percentage != null ? `${attempt.percentage}%` : "—"}
                  </td>
                  <td>
                    {attempt.is_passed === true && <span style={{ color: "var(--success)", fontWeight: 700, fontSize: 13 }}>Passed</span>}
                    {attempt.is_passed === false && <span style={{ color: "var(--danger)", fontWeight: 700, fontSize: 13 }}>Failed</span>}
                    {attempt.is_passed == null && <span style={{ color: "var(--muted)", fontSize: 13 }}>Pending</span>}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{attempt.started_at ? formatDate(attempt.started_at) : "—"}</td>
                  <td>
                    <Link className="button button-secondary button-small" href={`/admin/assessments/attempts/${attempt.id}`}>
                      <ExternalLink size={13} /> Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function ResultsPage() {
  const params = useParams();
  return <ResultsContent id={params.id as string} />;
}
