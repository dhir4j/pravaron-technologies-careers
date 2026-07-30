"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Send, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { LoadingBlock, Feedback } from "@/components/ui";
import { ProctoringMonitor } from "@/components/proctoring-monitor";
import type { Assessment, AssessmentAttempt, AssessmentQuestion } from "@/lib/types";

// Lazy-load Monaco to avoid SSR errors
import dynamic from "next/dynamic";
const MonacoEditor = dynamic(() => import("@monaco-editor/react").then(m => m.default), { ssr: false, loading: () => <div style={{ height: 300, background: "#1e1e1e", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>Loading editor…</div> });

interface AttemptState {
  attempt: AssessmentAttempt;
  assessment: Assessment;
  questions: AssessmentQuestion[];
}

interface ResponseMap {
  [questionId: string]: unknown;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function QuestionRenderer({
  question,
  value,
  onChange,
}: {
  question: AssessmentQuestion;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (question.question_type === "mcq") {
    return (
      <div className="mcq-options">
        {(question.options ?? []).map((opt, i) => (
          <label key={i} className={`mcq-option ${value === opt ? "selected" : ""}`} style={{ cursor: "pointer" }}>
            <input type="radio" name={`q_${question.id}`} checked={value === opt} onChange={() => onChange(opt)} style={{ accentColor: "var(--accent)" }} />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    );
  }

  if (question.question_type === "multi_select") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    const toggle = (opt: string) => {
      const next = selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt];
      onChange(next);
    };
    return (
      <div className="mcq-options">
        {(question.options ?? []).map((opt, i) => (
          <label key={i} className={`mcq-option ${selected.includes(opt) ? "selected" : ""}`} style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} style={{ accentColor: "var(--accent)" }} />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    );
  }

  if (question.question_type === "code") {
    return (
      <div style={{ border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ background: "#1e1e1e", padding: "6px 12px", fontSize: 12, color: "#888", fontFamily: "var(--font-mono)", display: "flex", justifyContent: "space-between" }}>
          <span>{question.code_language ?? "javascript"}</span>
          <span>Code Editor</span>
        </div>
        <MonacoEditor
          height="340px"
          language={question.code_language ?? "javascript"}
          value={typeof value === "string" ? value : (question.code_template ?? "")}
          onChange={v => onChange(v ?? "")}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>
    );
  }

  if (question.question_type === "text") {
    return (
      <textarea
        rows={8}
        placeholder="Type your answer here…"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        style={{ resize: "vertical", fontFamily: "inherit" }}
      />
    );
  }

  if (question.question_type === "file_upload") {
    return (
      <div style={{ padding: 20, border: "2px dashed var(--line-strong)", borderRadius: 8, textAlign: "center" }}>
        <p style={{ color: "var(--muted)", marginBottom: 12 }}>Upload your answer file</p>
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onChange(file.name);
          }}
        />
        {typeof value === "string" && value && (
          <p style={{ fontSize: 13, color: "var(--success)", marginTop: 8 }}>Selected: {value}</p>
        )}
      </div>
    );
  }

  return null;
}

export function AssessmentAttemptView({ attemptId }: { attemptId: string }) {
  const [state, setState] = useState<AttemptState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<ResponseMap>({});
  const [savingResponse, setSavingResponse] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ attempt: AssessmentAttempt; assessment: Assessment; questions: AssessmentQuestion[] }>(
        `/candidate/assessments/attempts/${attemptId}`,
      );
      // If not started yet, start it
      let attempt = data.attempt;
      if (attempt.status === "not_started") {
        const startData = await api<{ attempt: AssessmentAttempt }>(`/candidate/assessments/${data.assessment.id}/start`, { method: "POST" });
        attempt = startData.attempt;
      }
      setState({ attempt, assessment: data.assessment, questions: data.questions });

      // Prefill existing responses
      const prefilled: ResponseMap = {};
      for (const r of attempt.responses ?? []) {
        prefilled[r.question_id] = r.response;
      }
      setResponses(prefilled);

      // Compute time left
      if (attempt.expires_at) {
        const expiresAt = new Date(attempt.expires_at).getTime();
        const now = Date.now();
        setTimeLeft(Math.max(0, Math.floor((expiresAt - now) / 1000)));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load assessment");
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => { load(); }, [load]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t === null) return null;
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft !== null]);

  const saveResponse = useCallback(async (questionId: string, response: unknown) => {
    if (!state) return;
    setSavingResponse(true);
    try {
      await api(`/candidate/assessments/attempts/${attemptId}/responses`, {
        method: "POST",
        body: { question_id: questionId, response },
      });
    } catch {
      // non-critical, don't show error
    } finally {
      setSavingResponse(false);
    }
  }, [attemptId, state]);

  const handleResponseChange = (questionId: string, value: unknown) => {
    setResponses(p => ({ ...p, [questionId]: value }));
    // Debounced auto-save
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => saveResponse(questionId, value), 1500);
  };

  const handleAutoSubmit = async () => {
    if (!state) return;
    try {
      await api(`/candidate/assessments/attempts/${attemptId}/submit`, { method: "POST" });
      setSubmitted(true);
    } catch {
      // silent
    }
  };

  const handleSubmit = async () => {
    if (!state) return;
    const unanswered = state.questions.filter(q => !responses[q.id] || (Array.isArray(responses[q.id]) && (responses[q.id] as unknown[]).length === 0));
    if (unanswered.length > 0) {
      const confirmed = window.confirm(`You have ${unanswered.length} unanswered question${unanswered.length > 1 ? "s" : ""}. Submit anyway?`);
      if (!confirmed) return;
    }
    setSubmitting(true);
    try {
      await api(`/candidate/assessments/attempts/${attemptId}/submit`, { method: "POST" });
      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock label="Loading assessment" />;
  if (error) return <Feedback tone="error">{error}</Feedback>;
  if (!state) return null;

  const { assessment, questions } = state;
  const currentQuestion = questions[currentIndex];
  const answeredCount = questions.filter(q => {
    const r = responses[q.id];
    return r !== undefined && r !== null && r !== "" && !(Array.isArray(r) && r.length === 0);
  }).length;

  if (submitted) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", flexDirection: "column", gap: 16, textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>✓</div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Assessment Submitted</h1>
        <p style={{ fontSize: 16, color: "var(--muted)", maxWidth: 440 }}>
          Your responses have been submitted. You will be notified when your results are ready.
        </p>
      </div>
    );
  }

  const isWarning = timeLeft !== null && timeLeft <= 300;
  const isDanger = timeLeft !== null && timeLeft <= 60;

  return (
    <ProctoringMonitor attemptId={attemptId}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 24px 80px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{assessment.title}</h1>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>{answeredCount} / {questions.length} answered</p>
          </div>
          {timeLeft !== null && (
            <div className={`assessment-timer ${isWarning ? "warning" : ""} ${isDanger ? "danger" : ""}`}>
              <Clock size={16} />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Question nav dots */}
        <div className="assessment-nav" style={{ marginBottom: 24 }}>
          {questions.map((q, i) => {
            const answered = responses[q.id] !== undefined && responses[q.id] !== null && responses[q.id] !== "" && !(Array.isArray(responses[q.id]) && (responses[q.id] as unknown[]).length === 0);
            return (
              <button
                key={q.id}
                className={`q-dot ${answered ? "answered" : ""} ${i === currentIndex ? "current" : ""}`}
                onClick={() => setCurrentIndex(i)}
                title={`Question ${i + 1}`}
              />
            );
          })}
        </div>

        {/* Current question */}
        {currentQuestion && (
          <div className="question-card">
            <div className="question-card-header">
              <div className="question-number">{currentIndex + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
                  <span className="question-type-badge">{currentQuestion.question_type}</span>
                  <span className="question-marks">{currentQuestion.marks} mark{currentQuestion.marks !== 1 ? "s" : ""}</span>
                  {savingResponse && <span style={{ fontSize: 11, color: "var(--muted)" }}>Saving…</span>}
                </div>
                <div className="question-content">{currentQuestion.content}</div>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <QuestionRenderer
                question={currentQuestion}
                value={responses[currentQuestion.id]}
                onChange={(v) => handleResponseChange(currentQuestion.id, v)}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
          <button
            className="button button-secondary"
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            {currentIndex < questions.length - 1 ? (
              <button
                className="button button-primary"
                onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button className="button button-primary" onClick={handleSubmit} disabled={submitting}>
                <Send size={16} /> {submitting ? "Submitting…" : "Submit Assessment"}
              </button>
            )}
          </div>
        </div>

        {error && <div style={{ marginTop: 16 }}><Feedback tone="error">{error}</Feedback></div>}
      </div>
    </ProctoringMonitor>
  );
}
