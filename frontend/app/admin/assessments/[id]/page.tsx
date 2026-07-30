"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Archive, CheckCircle } from "lucide-react";
import { AssessmentEditor } from "@/components/assessment-editor";
import { LoadingBlock, Feedback, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import type { Assessment } from "@/lib/types";

function EditAssessmentContent({ id }: { id: string }) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("60");
  const [passScore, setPassScore] = useState("60");
  const [instructions, setInstructions] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ assessment: Assessment }>(`/admin/assessments/${id}`);
      setAssessment(data.assessment);
      setTitle(data.assessment.title);
      setDescription(data.assessment.description ?? "");
      setTimeLimit(String(data.assessment.time_limit_minutes));
      setPassScore(String(data.assessment.pass_score));
      setInstructions(data.assessment.instructions ?? "");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load assessment");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const data = await api<{ assessment: Assessment }>(`/admin/assessments/${id}`, {
        method: "PATCH",
        body: { title, description, time_limit_minutes: parseInt(timeLimit), pass_score: parseInt(passScore), instructions },
      });
      setAssessment(data.assessment);
      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    try {
      const data = await api<{ assessment: Assessment }>(`/admin/assessments/${id}`, { method: "PATCH", body: { status: "active" } });
      setAssessment(data.assessment);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to publish");
    }
  };

  const archive = async () => {
    try {
      await api(`/admin/assessments/${id}`, { method: "DELETE" });
      window.location.href = "/admin/assessments";
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to archive");
    }
  };

  if (loading) return <LoadingBlock label="Loading assessment" />;
  if (!assessment) return <Feedback tone="error">{error || "Assessment not found"}</Feedback>;

  return (
    <>
      <Link className="back-link" href="/admin/assessments"><ArrowLeft size={16} /> Assessments</Link>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <p className="eyebrow">{assessment.assessment_type}</p>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{assessment.title}</h1>
          <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--muted)" }}>
            <span>{assessment.question_count} questions · {assessment.total_marks} marks · {assessment.time_limit_minutes} min</span>
          </div>
        </div>
        <StatusBadge value={assessment.status} />
        <div style={{ display: "flex", gap: 8 }}>
          {assessment.status === "draft" && (
            <button className="button button-primary button-small" onClick={publish}><CheckCircle size={14} /> Publish</button>
          )}
          <Link className="button button-secondary button-small" href={`/admin/assessments/${id}/results`}>Results</Link>
          <button className="button button-ghost button-small" onClick={archive}><Archive size={14} /></button>
        </div>
      </div>

      {error && <Feedback tone="error">{error}</Feedback>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28, alignItems: "start" }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Questions</h2>
          <AssessmentEditor assessment={assessment} onChange={setAssessment} />
        </div>
        <div>
          <div className="panel" style={{ padding: "24px 28px" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Settings</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="field-label">Title</label>
                <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="field-label">Description</label>
                <textarea className="field" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="field-label">Time (min)</label>
                  <input className="field" type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Pass score (%)</label>
                  <input className="field" type="number" value={passScore} onChange={(e) => setPassScore(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="field-label">Instructions</label>
                <textarea className="field" rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
              </div>
            </div>
            <div style={{ marginTop: 18, display: "flex", gap: 10, alignItems: "center" }}>
              <button className="button button-primary button-small" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save settings"}
              </button>
              {saved && <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 700 }}>Saved</span>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function EditAssessmentPage() {
  const params = useParams();
  return <EditAssessmentContent id={params.id as string} />;
}
