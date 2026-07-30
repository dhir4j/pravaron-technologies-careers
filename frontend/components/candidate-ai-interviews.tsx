"use client";

import { useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle, Clock, ListChecks } from "lucide-react";
import { LoadingBlock, EmptyState, Feedback, StatusBadge, PageIntro } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { AIInterview } from "@/lib/types";

const STATUS_ICONS: Record<string, ReactNode> = {
  scheduled: <Clock size={16} />,
  identity_verified: <CheckCircle size={16} />,
  in_progress: <ListChecks size={16} />,
  completed: <CheckCircle size={16} />,
  reviewed: <CheckCircle size={16} />,
};

function statusAction(interview: AIInterview) {
  if (interview.status === "scheduled" || interview.status === "identity_verified") {
    return { label: "Start MCQ", variant: "button-primary" };
  }
  if (interview.status === "in_progress") {
    return { label: "Continue", variant: "button-primary" };
  }
  return { label: "View summary", variant: "button-secondary" };
}

export function CandidateAIInterviews() {
  const [interviews, setInterviews] = useState<AIInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ interviews: AIInterview[] }>("/candidate/interviews/ai");
      setInterviews(data.interviews);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load interviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingBlock label="Loading interviews" />;
  if (error) return <Feedback tone="error">{error}</Feedback>;

  const pendingCount = interviews.filter(i => i.status === "scheduled" || i.status === "identity_verified" || i.status === "in_progress").length;
  const completedCount = interviews.filter(i => i.status === "completed" || i.status === "reviewed").length;

  return (
    <>
      <PageIntro
        eyebrow="Candidate interviews"
        title="MCQ interviews"
        body="Complete secured first-round MCQ interviews with camera monitoring, fullscreen protection, and role-based technical questions."
      />

      <div className="ai-list-metrics" aria-label="Interview summary">
        <div><span>Pending</span><strong>{pendingCount}</strong></div>
        <div><span>Completed</span><strong>{completedCount}</strong></div>
        <div><span>Total</span><strong>{interviews.length}</strong></div>
      </div>

      {interviews.length === 0 ? (
        <EmptyState title="No interviews scheduled" body="Your MCQ interviews will appear here when a recruiter invites you." />
      ) : (
        <div className="ai-interview-list">
          {interviews.map((interview) => {
            const action = statusAction(interview);
            const isDone = interview.status === "completed" || interview.status === "reviewed";

            return (
              <article key={interview.id} className="ai-interview-card">
                <div className="ai-interview-card-icon">
                  {STATUS_ICONS[interview.status] ?? <AlertCircle size={16} />}
                </div>
                <div className="ai-interview-card-main">
                  <div className="ai-interview-card-title-row">
                    <h2>{interview.job_title ?? "Interview"}</h2>
                    <StatusBadge value={interview.status} />
                  </div>
                  <div className="ai-interview-meta">
                    <span>{interview.question_count} question{interview.question_count === 1 ? "" : "s"}</span>
                    {interview.invitation_sent_at ? <span>Invited {formatDate(interview.invitation_sent_at)}</span> : null}
                    {interview.completed_at ? <span>Completed {formatDate(interview.completed_at)}</span> : null}
                  </div>
                  {isDone && interview.ai_summary?.overall ? (
                    <p>{interview.ai_summary.overall}</p>
                  ) : (
                    <p>Answer each question once. Camera monitoring and security checks stay active during the session.</p>
                  )}
                </div>
                <Link className={`button ${action.variant} button-small`} href={`/candidate/interviews/ai/${interview.id}`}>
                  {action.label} <ArrowRight size={14} />
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

