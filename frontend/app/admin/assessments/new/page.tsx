"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AssessmentEditor } from "@/components/assessment-editor";
import { Feedback, PageIntro } from "@/components/ui";
import { api } from "@/lib/api";
import type { Assessment } from "@/lib/types";

function NewAssessmentForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("aptitude");
  const [timeLimit, setTimeLimit] = useState("60");
  const [passScore, setPassScore] = useState("60");
  const [maxAttempts, setMaxAttempts] = useState("1");
  const [instructions, setInstructions] = useState("");
  const [randomize, setRandomize] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  const create = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError("");
    try {
      const data = await api<{ assessment: Assessment }>("/admin/assessments", {
        method: "POST",
        body: {
          title: title.trim(),
          description: description.trim(),
          assessment_type: type,
          time_limit_minutes: parseInt(timeLimit) || 60,
          pass_score: parseInt(passScore) || 60,
          max_attempts: parseInt(maxAttempts) || 1,
          instructions: instructions.trim(),
          randomize_questions: randomize,
        },
      });
      setAssessment(data.assessment);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create assessment");
    } finally {
      setSaving(false);
    }
  };

  if (assessment) {
    return (
      <>
        <Link className="back-link" href="/admin/assessments"><ArrowLeft size={16} /> Assessments</Link>
        <PageIntro title={assessment.title} eyebrow="Add Questions" body="Now add questions to your assessment. You can add multiple-choice, text, coding, and file upload questions." />
        <AssessmentEditor assessment={assessment} onChange={setAssessment} />
        <div style={{ marginTop: 28, display: "flex", gap: 12 }}>
          <button className="button button-primary" onClick={() => router.push(`/admin/assessments/${assessment.id}`)}>
            Done — go to assessment
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Link className="back-link" href="/admin/assessments"><ArrowLeft size={16} /> Assessments</Link>
      <PageIntro eyebrow="New Assessment" title="Create Assessment" body="Configure the assessment settings first. You can add questions on the next step." />
      {error && <Feedback tone="error">{error}</Feedback>}
      <div style={{ maxWidth: 600 }}>
        <div className="panel" style={{ padding: "28px 32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label className="field-label">Assessment title *</label>
              <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Full-Stack Developer Technical Screen" />
            </div>
            <div>
              <label className="field-label">Description</label>
              <textarea className="field" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description for candidates…" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div>
                <label className="field-label">Type</label>
                <select className="field" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="aptitude">Aptitude</option>
                  <option value="technical">Technical</option>
                  <option value="coding">Coding</option>
                  <option value="assignment">Assignment</option>
                </select>
              </div>
              <div>
                <label className="field-label">Time limit (minutes)</label>
                <input className="field" type="number" min={5} value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />
              </div>
              <div>
                <label className="field-label">Max attempts</label>
                <input className="field" type="number" min={1} value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="field-label">Pass score (%)</label>
              <input className="field" type="number" min={0} max={100} value={passScore} onChange={(e) => setPassScore(e.target.value)} style={{ maxWidth: 120 }} />
            </div>
            <div>
              <label className="field-label">Candidate instructions</label>
              <textarea className="field" rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Instructions shown to candidates before they start…" />
            </div>
            <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={randomize} onChange={(e) => setRandomize(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
              <span style={{ fontSize: 14 }}>Randomize question order for each candidate</span>
            </label>
          </div>
          <div style={{ marginTop: 24 }}>
            <button className="button button-primary" onClick={create} disabled={saving}>
              {saving ? "Creating…" : "Create and add questions →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function NewAssessmentPage() {
  return <NewAssessmentForm />;
}
