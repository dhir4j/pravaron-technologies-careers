"use client";

import Link from "next/link";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Application } from "@/lib/types";
import { Feedback, LoadingBlock, StatusBadge } from "@/components/ui";

export function CandidateApplicationDetail({ id }: { id: string }) {
  const [application, setApplication] = useState<Application | null>(null);
  const [error, setError] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  useEffect(() => {
    api<{ application: Application }>(`/candidate/applications/${id}`)
      .then((response) => setApplication(response.application))
      .catch((requestError: Error) => setError(requestError.message));
  }, [id]);

  async function withdraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWithdrawing(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await api<{ application: Application }>(
        `/candidate/applications/${id}/withdraw`,
        { method: "POST", body: { reason: form.get("reason") } },
      );
      setApplication(response.application);
      setShowWithdraw(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Withdrawal failed");
    } finally {
      setWithdrawing(false);
    }
  }

  if (error && !application) return <Feedback tone="error">{error}</Feedback>;
  if (!application) return <LoadingBlock label="Loading application" />;
  const canWithdraw = !["Application Withdrawn", "Hired", "Not Selected"].includes(application.candidate_status);

  return (
    <>
      <Link className="back-link" href="/candidate/applications"><ArrowLeft size={17} /> Applications</Link>
      <header className="application-detail-heading">
        <div>
          <StatusBadge value={application.candidate_status} />
          <h1>{application.job.title}</h1>
          <p>{application.job.public_code} | Applied {formatDate(application.created_at)}</p>
        </div>
        {canWithdraw ? (
          <button className="button button-danger" onClick={() => setShowWithdraw(true)}>
            Withdraw application
          </button>
        ) : null}
      </header>
      {error ? <Feedback tone="error">{error}</Feedback> : null}

      <div className="detail-grid">
        <section className="panel panel-wide">
          <h2>Application timeline</h2>
          <ol className="timeline">
            {(application.timeline || []).map((event, index) => (
              <li key={`${event.event_type}-${event.created_at}`}>
                <span>{index + 1}</span>
                <div>
                  <strong>{event.status || event.event_type.replaceAll("_", " ")}</strong>
                  {event.note ? <p>{event.note}</p> : null}
                  <small>{formatDate(event.created_at, true)}</small>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <aside className="panel">
          <h2>Submitted resume</h2>
          {application.resume ? (
            <div className="file-summary">
              <FileText size={22} />
              <span>
                <strong>{application.resume.original_filename}</strong>
                <small>Version {application.resume.version}</small>
              </span>
            </div>
          ) : <p>No resume record.</p>}
          <h2>Application ID</h2>
          <code>{application.id}</code>
          <a className="text-link" href="mailto:careers@pravarontechnologies.com">
            <Download size={16} />
            Contact hiring support
          </a>
        </aside>
        <section className="panel panel-wide">
          <h2>Your message</h2>
          <p>{application.cover_message || "No cover message was included."}</p>
          {application.answers && Object.keys(application.answers).length ? (
            <div className="answer-list">
              {Object.entries(application.answers).map(([key, value]) => (
                <div key={key}><strong>{key.replaceAll("_", " ")}</strong><p>{String(value)}</p></div>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      {showWithdraw ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowWithdraw(false)}>
          <form className="modal" onSubmit={withdraw} onMouseDown={(event) => event.stopPropagation()}>
            <h2>Withdraw this application?</h2>
            <p>This stops further recruitment activity for this application.</p>
            <label><span>Reason (optional)</span><textarea name="reason" rows={4} /></label>
            <div className="modal-actions">
              <button type="button" className="button button-secondary" onClick={() => setShowWithdraw(false)}>Keep application</button>
              <button className="button button-danger" disabled={withdrawing}>{withdrawing ? "Withdrawing" : "Confirm withdrawal"}</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
