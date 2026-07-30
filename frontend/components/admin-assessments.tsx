"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, ClipboardList, Users } from "lucide-react";
import { api } from "@/lib/api";
import type { Assessment } from "@/lib/types";
import { LoadingBlock, EmptyState, PageIntro, Feedback } from "@/components/ui";
import { formatDate } from "@/lib/format";

export function AdminAssessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ assessments: Assessment[] }>("/admin/assessments");
      setAssessments(data.assessments);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load assessments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const statusColor = (s: string) => {
    if (s === "active") return "var(--success)";
    if (s === "archived") return "var(--muted)";
    return "var(--warning)";
  };

  return (
    <>
      <PageIntro
        eyebrow="Assessment Platform"
        title="Assessments"
        body="Create and manage assessments for candidates. Assign them to applications and review results."
        action={
          <Link className="button button-primary" href="/admin/assessments/new">
            <Plus size={16} /> New Assessment
          </Link>
        }
      />

      {loading && <LoadingBlock label="Loading assessments" />}
      {error && <Feedback tone="error">{error}</Feedback>}

      {!loading && !error && assessments.length === 0 && (
        <EmptyState
          title="No assessments yet"
          body="Create your first assessment to start screening candidates with structured tests."
          action={
            <Link className="button button-primary" href="/admin/assessments/new">
              <Plus size={15} /> Create assessment
            </Link>
          }
        />
      )}

      {!loading && assessments.length > 0 && (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {assessments.map((a) => (
            <div key={a.id} className="panel" style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", background: "var(--surface)", padding: "3px 10px", borderRadius: 999 }}>
                  {a.assessment_type}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: statusColor(a.status) }}>
                  {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                </span>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{a.title}</h3>
              {a.description && <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14, lineHeight: 1.5 }}>{a.description.slice(0, 100)}{a.description.length > 100 ? "…" : ""}</p>}
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
                <span><ClipboardList size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />{a.question_count} questions · {a.total_marks} marks</span>
                <span>{a.time_limit_minutes} min · Pass {a.pass_score}%</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 16 }}>Created {formatDate(a.created_at)}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <Link className="button button-secondary button-small" href={`/admin/assessments/${a.id}`} style={{ flex: 1, justifyContent: "center" }}>
                  Edit
                </Link>
                <Link className="button button-ghost button-small" href={`/admin/assessments/${a.id}/results`}>
                  <Users size={13} /> Results
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
