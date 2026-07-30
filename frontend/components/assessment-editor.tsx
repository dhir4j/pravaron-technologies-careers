"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "@/lib/api";
import type { Assessment, AssessmentQuestion } from "@/lib/types";
import { Feedback } from "@/components/ui";

const QUESTION_TYPES = [
  { value: "mcq", label: "Multiple Choice (single answer)" },
  { value: "multi_select", label: "Multiple Choice (multiple answers)" },
  { value: "text", label: "Text / Short Answer" },
  { value: "code", label: "Coding" },
  { value: "file_upload", label: "File Upload" },
];

const CODE_LANGUAGES = ["python", "javascript", "typescript", "java", "cpp", "c", "go", "rust", "sql", "bash"];

interface QuestionFormProps {
  assessmentId: string;
  question?: AssessmentQuestion;
  onSave: (q: AssessmentQuestion) => void;
  onDelete?: () => void;
  defaultOrder: number;
}

function QuestionForm({ assessmentId, question, onSave, onDelete, defaultOrder }: QuestionFormProps) {
  const [expanded, setExpanded] = useState(!question);
  const [type, setType] = useState(question?.question_type ?? "mcq");
  const [content, setContent] = useState(question?.content ?? "");
  const [marks, setMarks] = useState(String(question?.marks ?? 1));
  const [options, setOptions] = useState<string[]>(question?.options ?? ["", ""]);
  const [correctAnswer, setCorrectAnswer] = useState<string | string[]>(
    question?.correct_answer != null ? (Array.isArray(question.correct_answer) ? question.correct_answer as string[] : String(question.correct_answer)) : ""
  );
  const [explanation, setExplanation] = useState(question?.explanation ?? "");
  const [codeTemplate, setCodeTemplate] = useState(question?.code_template ?? "");
  const [codeLanguage, setCodeLanguage] = useState(question?.code_language ?? "python");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!content.trim()) { setError("Question content is required"); return; }
    setSaving(true);
    setError("");
    const body = {
      question_type: type,
      content: content.trim(),
      marks: parseInt(marks) || 1,
      options: (type === "mcq" || type === "multi_select") ? options.filter(o => o.trim()) : [],
      correct_answer: (type === "mcq") ? correctAnswer : (type === "multi_select") ? correctAnswer : null,
      explanation: explanation.trim(),
      code_template: type === "code" ? codeTemplate : "",
      code_language: type === "code" ? codeLanguage : "",
      order: question?.order ?? defaultOrder,
    };
    try {
      const url = question ? `/admin/assessments/questions/${question.id}` : `/admin/assessments/${assessmentId}/questions`;
      const method = question ? "PATCH" : "POST";
      const data = await api<{ question: AssessmentQuestion }>(url, { method, body });
      onSave(data.question);
      if (!question) {
        setContent(""); setOptions(["", ""]); setCorrectAnswer(""); setExplanation("");
      }
      setExpanded(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: "var(--radius)", overflow: "hidden", marginBottom: 12 }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: "var(--surface)", cursor: "pointer" }}
        onClick={() => setExpanded(e => !e)}
      >
        <GripVertical size={16} style={{ color: "var(--faint)" }} />
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: content ? "var(--ink)" : "var(--faint)" }}>
          {content ? content.slice(0, 80) + (content.length > 80 ? "…" : "") : "New question"}
        </span>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{marks} mark{Number(marks) !== 1 ? "s" : ""}</span>
        <span style={{ fontSize: 11, background: "var(--surface-2)", padding: "2px 8px", borderRadius: 999, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>{type}</span>
        {onDelete && (
          <button className="icon-button icon-button-danger" style={{ width: 28, height: 28 }} onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 size={13} />
          </button>
        )}
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {expanded && (
        <div style={{ padding: "20px 18px", background: "var(--paper)" }}>
          {error && <Feedback tone="error">{error}</Feedback>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 100px", gap: 12, marginBottom: 16 }}>
            <div>
              <label className="field-label">Question type</label>
              <select className="field" value={type} onChange={(e) => setType(e.target.value as AssessmentQuestion["question_type"])}>
                {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {type === "code" && (
              <div>
                <label className="field-label">Language</label>
                <select className="field" value={codeLanguage} onChange={(e) => setCodeLanguage(e.target.value)}>
                  {CODE_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="field-label">Marks</label>
              <input className="field" type="number" min={1} value={marks} onChange={(e) => setMarks(e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="field-label">Question</label>
            <textarea
              className="field"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the question text…"
              style={{ resize: "vertical" }}
            />
          </div>

          {(type === "mcq" || type === "multi_select") && (
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Options</label>
              {options.map((opt, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  {type === "mcq" ? (
                    <input type="radio" name="correct" checked={correctAnswer === opt && opt !== ""} onChange={() => setCorrectAnswer(opt)} style={{ accentColor: "var(--accent)" }} />
                  ) : (
                    <input type="checkbox" checked={Array.isArray(correctAnswer) && correctAnswer.includes(opt)} onChange={() => {
                      const arr = Array.isArray(correctAnswer) ? [...correctAnswer] : [];
                      setCorrectAnswer(arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt]);
                    }} style={{ accentColor: "var(--accent)" }} />
                  )}
                  <input
                    className="field"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...options];
                      if (type === "mcq" && correctAnswer === options[i]) setCorrectAnswer(e.target.value);
                      if (type === "multi_select" && Array.isArray(correctAnswer) && correctAnswer.includes(options[i])) {
                        setCorrectAnswer(correctAnswer.map(x => x === options[i] ? e.target.value : x));
                      }
                      newOpts[i] = e.target.value;
                      setOptions(newOpts);
                    }}
                    placeholder={`Option ${i + 1}`}
                    style={{ flex: 1 }}
                  />
                  {options.length > 2 && (
                    <button className="icon-button" style={{ width: 28, height: 28 }} onClick={() => setOptions(options.filter((_, j) => j !== i))}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
              <button className="button button-ghost button-small" onClick={() => setOptions([...options, ""])} style={{ marginTop: 4 }}>
                <Plus size={13} /> Add option
              </button>
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                {type === "mcq" ? "Select the radio button next to the correct answer." : "Check all correct answers."}
              </p>
            </div>
          )}

          {type === "code" && (
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Starter code template (optional)</label>
              <textarea
                className="field"
                rows={6}
                value={codeTemplate}
                onChange={(e) => setCodeTemplate(e.target.value)}
                placeholder={`# Write your ${codeLanguage} starter code here…`}
                style={{ fontFamily: "var(--font-mono), monospace", fontSize: 13, resize: "vertical" }}
              />
            </div>
          )}

          <div style={{ marginBottom: 18 }}>
            <label className="field-label">Explanation (shown after submission)</label>
            <textarea className="field" rows={2} value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Optional: explain the correct answer…" />
          </div>

          <button className="button button-primary button-small" onClick={save} disabled={saving}>
            {saving ? "Saving…" : question ? "Update question" : "Add question"}
          </button>
        </div>
      )}
    </div>
  );
}

interface AssessmentEditorProps {
  assessment: Assessment;
  onChange: (updated: Assessment) => void;
}

export function AssessmentEditor({ assessment, onChange }: AssessmentEditorProps) {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>(assessment.questions ?? []);
  const [addingNew, setAddingNew] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleSave = (q: AssessmentQuestion) => {
    setQuestions(prev => {
      const idx = prev.findIndex(p => p.id === q.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = q;
        return next;
      }
      return [...prev, q];
    });
    setAddingNew(false);
    onChange({ ...assessment, questions: questions, question_count: questions.length });
  };

  const handleDelete = async (questionId: string) => {
    setDeleteError("");
    try {
      await api(`/admin/assessments/questions/${questionId}`, { method: "DELETE" });
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : "Failed to delete question");
    }
  };

  return (
    <div>
      {deleteError && <Feedback tone="error">{deleteError}</Feedback>}
      <div style={{ marginBottom: 8 }}>
        {questions.map((q, i) => (
          <QuestionForm
            key={q.id}
            assessmentId={assessment.id}
            question={q}
            onSave={handleSave}
            onDelete={() => handleDelete(q.id)}
            defaultOrder={i}
          />
        ))}
      </div>

      {addingNew ? (
        <QuestionForm
          assessmentId={assessment.id}
          onSave={handleSave}
          defaultOrder={questions.length}
        />
      ) : (
        <button className="button button-secondary" onClick={() => setAddingNew(true)} style={{ width: "100%" }}>
          <Plus size={16} /> Add question
        </button>
      )}

      <div style={{ marginTop: 16, padding: "12px 16px", background: "var(--surface)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--muted)" }}>
        {questions.length} question{questions.length !== 1 ? "s" : ""} · {questions.reduce((s, q) => s + q.marks, 0)} total marks
      </div>
    </div>
  );
}
