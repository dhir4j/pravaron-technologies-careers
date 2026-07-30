"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ShieldCheck, LockKeyhole, LoaderCircle } from "lucide-react";
import { api } from "@/lib/api";
import { AIInterviewSession } from "@/components/ai-interview-session";
import { Feedback, LoadingBlock, StatusBadge } from "@/components/ui";

type PublicSummary = {
  interview: {
    id: string;
    candidate_name?: string;
    job_title?: string;
    status: string;
    requires_code: boolean;
  };
};

export function PublicInterviewEntry({ interviewId }: { interviewId: string }) {
  const [summary, setSummary] = useState<PublicSummary["interview"] | null>(null);
  const [code, setCode] = useState("");
  const [verifiedCode, setVerifiedCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const normalizedCode = useMemo(() => code.trim().toUpperCase().replace(/\s+/g, ""), [code]);

  useEffect(() => {
    let active = true;
    api<PublicSummary>(`/public/interviews/ai/${interviewId}`)
      .then((data) => {
        if (!active) return;
        setSummary(data.interview);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Interview link is not available.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [interviewId]);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!normalizedCode) {
      setError("Enter the interview code from your email.");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      await api(`/public/interviews/ai/${interviewId}/verify`, {
        method: "POST",
        body: { access_code: normalizedCode },
      });
      setVerifiedCode(normalizedCode);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid interview code.");
    } finally {
      setVerifying(false);
    }
  }

  if (verifiedCode) {
    return <AIInterviewSession interviewId={interviewId} accessCode={verifiedCode} publicMode />;
  }

  return (
    <main className="public-interview-gate">
      <section className="public-interview-card">
        {loading ? (
          <LoadingBlock label="Opening interview" />
        ) : (
          <>
            <div className="public-interview-mark"><ShieldCheck size={30} /></div>
            <p className="secure-kicker">Secure interview access</p>
            <h1>{summary?.job_title ? `${summary.job_title} interview` : "Interview access"}</h1>
            {summary?.status ? <StatusBadge value={summary.status} /> : null}
            <p>Enter the interview code from your email to open the secured interview screen.</p>
            <form onSubmit={verify} className="public-interview-form">
              <label>
                <span>Interview code</span>
                <div>
                  <LockKeyhole size={18} />
                  <input
                    value={code}
                    onChange={(event) => setCode(event.target.value.toUpperCase())}
                    placeholder="Enter code"
                    autoComplete="one-time-code"
                    inputMode="text"
                    maxLength={12}
                    autoFocus
                  />
                </div>
              </label>
              <button className="button button-primary button-wide" disabled={verifying || !normalizedCode}>
                {verifying ? <LoaderCircle className="spin" size={16} /> : <ShieldCheck size={16} />}
                {verifying ? "Verifying" : "Continue to interview"}
              </button>
            </form>
            {error ? <Feedback tone="error">{error}</Feedback> : null}
          </>
        )}
      </section>
    </main>
  );
}