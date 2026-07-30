"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Code2, ListChecks, Plus, Trash2 } from "lucide-react";
import { EmptyState, Feedback, LoadingBlock, PageIntro } from "@/components/ui";
import { api } from "@/lib/api";
import type { AIInterviewQuestionTemplate, Job } from "@/lib/types";

const blankMcqForm = {
  job_id: "",
  category: "technical",
  content: "",
  options: ["", "", "", ""],
  correct_answer: "",
  marks: 1,
  difficulty: "standard",
};

const blankCodeForm = {
  job_id: "",
  content: "",
  difficulty: "standard",
  marks: 1,
};

type SetupMode = "mcq" | "code";

type SetupResponse = {
  jobs: Job[];
  questions: AIInterviewQuestionTemplate[];
};

function categoryLabel(value: string) {
  if (value === "gk") return "GK";
  if (value === "aptitude") return "Aptitude";
  return "Technical";
}

export function InterviewSetup() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [questions, setQuestions] = useState<AIInterviewQuestionTemplate[]>([]);
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupError, setSetupError] = useState("");
  const [setupSuccess, setSetupSuccess] = useState("");
  const [selectedSetupJobId, setSelectedSetupJobId] = useState("");
  const [mode, setMode] = useState<SetupMode>("mcq");
  const [mcqForm, setMcqForm] = useState(blankMcqForm);
  const [codeForm, setCodeForm] = useState(blankCodeForm);
  const [savingQuestion, setSavingQuestion] = useState(false);

  const loadSetup = useCallback(async (nextMode: SetupMode = mode) => {
    setSetupLoading(true);
    try {
      const data = await api<SetupResponse>(`/admin/interviews/setup?mode=${nextMode}`);
      setJobs(data.jobs);
      setQuestions(data.questions);
      const firstJobId = data.jobs[0]?.id ?? "";
      setSelectedSetupJobId(current => current || firstJobId);
      setMcqForm(current => ({ ...current, job_id: current.job_id || firstJobId }));
      setCodeForm(current => ({ ...current, job_id: current.job_id || firstJobId }));
    } catch (e: unknown) {
      setSetupError(e instanceof Error ? e.message : "Failed to load interview setup");
    } finally {
      setSetupLoading(false);
    }
  }, [mode]);

  useEffect(() => { loadSetup(mode); }, [loadSetup, mode]);

  const visibleQuestions = useMemo(
    () => questions.filter(question => !selectedSetupJobId || question.job_id === selectedSetupJobId),
    [questions, selectedSetupJobId],
  );

  const categoryCounts = visibleQuestions.reduce<Record<string, number>>((acc, question) => {
    acc[question.category] = (acc[question.category] ?? 0) + 1;
    return acc;
  }, {});

  const saveMcqQuestion = async () => {
    setSavingQuestion(true);
    setSetupError("");
    setSetupSuccess("");
    try {
      await api("/admin/interviews/setup/questions", {
        method: "POST",
        body: {
          ...mcqForm,
          mode: "mcq",
          options: mcqForm.options.map(option => option.trim()).filter(Boolean),
          correct_answer: mcqForm.correct_answer.trim(),
        },
      });
      setSetupSuccess("MCQ question added to this job setup.");
      setMcqForm(current => ({ ...blankMcqForm, job_id: current.job_id, category: current.category }));
      await loadSetup("mcq");
    } catch (e: unknown) {
      setSetupError(e instanceof Error ? e.message : "Failed to add MCQ question");
    } finally {
      setSavingQuestion(false);
    }
  };

  const saveCodeQuestion = async () => {
    setSavingQuestion(true);
    setSetupError("");
    setSetupSuccess("");
    try {
      await api("/admin/interviews/setup/questions", {
        method: "POST",
        body: { ...codeForm, mode: "code", category: "technical" },
      });
      setSetupSuccess("Code-based task saved for this job setup.");
      setCodeForm(current => ({ ...blankCodeForm, job_id: current.job_id }));
      await loadSetup("code");
    } catch (e: unknown) {
      setSetupError(e instanceof Error ? e.message : "Failed to add code task");
    } finally {
      setSavingQuestion(false);
    }
  };

  const deleteSetupQuestion = async (id: string) => {
    if (!window.confirm("Delete this setup question?")) return;
    try {
      await api(`/admin/interviews/setup/questions/${id}`, { method: "DELETE" });
      setQuestions(prev => prev.filter(question => question.id !== id));
    } catch (e: unknown) {
      setSetupError(e instanceof Error ? e.message : "Failed to delete question");
    }
  };

  return (
    <>
      <PageIntro
        eyebrow="Interview workflow"
        title="Interview setup"
        body="Create job-based MCQ question banks and save code-based task prompts for interview rounds."
      />

      <div className="interview-mode-tabs" role="tablist" aria-label="Interview setup mode">
        <button className={mode === "mcq" ? "active" : ""} onClick={() => setMode("mcq")} type="button"><ListChecks size={16} /> MCQ test</button>
        <button className={mode === "code" ? "active" : ""} onClick={() => setMode("code")} type="button"><Code2 size={16} /> Code-based task</button>
      </div>

      <section className="interview-setup-grid">
        <div className="interview-setup-main">
          <div className="ai-section-heading compact">
            <h2>{mode === "mcq" ? "MCQ question bank" : "Code-based task bank"}</h2>
            <span>{visibleQuestions.length} saved</span>
          </div>

          <div className="interview-job-filter">
            <label>
              <span>Job post</span>
              <select
                value={selectedSetupJobId}
                onChange={(event) => {
                  setSelectedSetupJobId(event.target.value);
                  setMcqForm(current => ({ ...current, job_id: event.target.value }));
                  setCodeForm(current => ({ ...current, job_id: event.target.value }));
                }}
              >
                {jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
              </select>
            </label>
            {mode === "mcq" ? (
              <div className="interview-composition-pills">
                <span>Need 12 aptitude</span>
                <span>Need 6 GK</span>
                <span>Need 12 technical</span>
              </div>
            ) : (
              <div className="interview-composition-pills"><span>Code setup saved for later code-based rounds</span></div>
            )}
          </div>

          {setupLoading ? <LoadingBlock label="Loading setup questions" /> : null}
          {setupError ? <Feedback tone="error">{setupError}</Feedback> : null}
          {setupSuccess ? <Feedback tone="success">{setupSuccess}</Feedback> : null}

          {mode === "mcq" ? (
            <div className="question-bank-list">
              <div className="question-bank-counts">
                <div><span>Aptitude</span><strong>{categoryCounts.aptitude ?? 0}/12</strong></div>
                <div><span>GK</span><strong>{categoryCounts.gk ?? 0}/6</strong></div>
                <div><span>Technical</span><strong>{categoryCounts.technical ?? 0}/12</strong></div>
              </div>
              {visibleQuestions.length === 0 ? (
                <EmptyState title="No setup questions for this job" body="Add MCQs here. If a category has fewer than required, the platform fills the remaining slots from the default bank." />
              ) : visibleQuestions.map(question => (
                <article className="question-bank-row" key={question.id}>
                  <div>
                    <div className="question-bank-meta"><span>{categoryLabel(question.category)}</span><span>{question.marks} mark</span><span>{question.difficulty}</span></div>
                    <h3>{question.content}</h3>
                    <p>{question.options.join(" | ")}</p>
                    <strong>Answer: {question.correct_answer}</strong>
                  </div>
                  <button className="icon-danger" onClick={() => deleteSetupQuestion(question.id)} title="Delete question" type="button"><Trash2 size={16} /></button>
                </article>
              ))}
            </div>
          ) : (
            <div className="question-bank-list">
              {visibleQuestions.length === 0 ? (
                <EmptyState title="No code tasks for this job" body="Save code-based prompts here now. Scheduling will be connected when the code round is enabled." />
              ) : visibleQuestions.map(question => (
                <article className="question-bank-row" key={question.id}>
                  <div>
                    <div className="question-bank-meta"><span>Code task</span><span>{question.marks} mark</span><span>{question.difficulty}</span></div>
                    <h3>{question.content}</h3>
                  </div>
                  <button className="icon-danger" onClick={() => deleteSetupQuestion(question.id)} title="Delete task" type="button"><Trash2 size={16} /></button>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="interview-setup-side">
          {mode === "mcq" ? (
            <div className="setup-form-card">
              <h2>Add MCQ question</h2>
              <label><span>Job</span><select value={mcqForm.job_id} onChange={(event) => setMcqForm(current => ({ ...current, job_id: event.target.value }))}>{jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}</select></label>
              <label><span>Category</span><select value={mcqForm.category} onChange={(event) => setMcqForm(current => ({ ...current, category: event.target.value }))}><option value="aptitude">Aptitude</option><option value="gk">GK</option><option value="technical">Technical</option></select></label>
              <label><span>Question</span><textarea rows={4} value={mcqForm.content} onChange={(event) => setMcqForm(current => ({ ...current, content: event.target.value }))} placeholder="Write the question shown to candidates" /></label>
              {mcqForm.options.map((option, index) => (
                <label key={index}><span>Option {String.fromCharCode(65 + index)}</span><input value={option} onChange={(event) => setMcqForm(current => ({ ...current, options: current.options.map((item, itemIndex) => itemIndex === index ? event.target.value : item) }))} /></label>
              ))}
              <label><span>Correct answer</span><select value={mcqForm.correct_answer} onChange={(event) => setMcqForm(current => ({ ...current, correct_answer: event.target.value }))}><option value="">Select answer</option>{mcqForm.options.filter(Boolean).map(option => <option key={option} value={option}>{option}</option>)}</select></label>
              <button className="button button-primary button-wide" onClick={saveMcqQuestion} disabled={savingQuestion || !mcqForm.job_id}><Plus size={15} /> {savingQuestion ? "Saving" : "Add question"}</button>
            </div>
          ) : (
            <div className="setup-form-card">
              <h2>Add code-based task</h2>
              <label><span>Job</span><select value={codeForm.job_id} onChange={(event) => setCodeForm(current => ({ ...current, job_id: event.target.value }))}>{jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}</select></label>
              <label><span>Task prompt</span><textarea rows={8} value={codeForm.content} onChange={(event) => setCodeForm(current => ({ ...current, content: event.target.value }))} placeholder="Describe the coding task, constraints, and expected output" /></label>
              <button className="button button-primary button-wide" onClick={saveCodeQuestion} disabled={savingQuestion || !codeForm.job_id}><Plus size={15} /> {savingQuestion ? "Saving" : "Save code task"}</button>
            </div>
          )}
        </aside>
      </section>
    </>
  );
}
