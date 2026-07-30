"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Download, FileText, XCircle } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CAREERS_CONTACT_EMAIL } from "@/lib/contact";
import { formatDate } from "@/lib/format";
import type { Application, OfferLetter } from "@/lib/types";
import { Feedback, LoadingBlock, StatusBadge } from "@/components/ui";

export function CandidateApplicationDetail({ id }: { id: string }) {
  const [application, setApplication] = useState<Application | null>(null);
  const [offerLetter, setOfferLetter] = useState<OfferLetter | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [respondingOffer, setRespondingOffer] = useState<"accepted" | "declined" | null>(null);
  const [showWithdraw, setShowWithdraw] = useState(false);

  useEffect(() => {
    Promise.all([
      api<{ application: Application }>(`/candidate/applications/${id}`),
      api<{ offer_letter: OfferLetter | null }>(`/candidate/applications/${id}/offer`).catch(() => ({ offer_letter: null })),
    ])
      .then(([applicationResponse, offerResponse]) => {
        setApplication(applicationResponse.application);
        setOfferLetter(offerResponse.offer_letter);
      })
      .catch((requestError: Error) => setError(requestError.message));
  }, [id]);

  async function respondToOffer(decision: "accepted" | "declined") {
    setRespondingOffer(decision);
    setError("");
    setSuccess("");
    try {
      const response = await api<{ application: Application; offer_letter: OfferLetter }>(
        `/candidate/applications/${id}/offer/respond`,
        { method: "POST", body: { decision } },
      );
      setApplication(response.application);
      setOfferLetter(response.offer_letter);
      setSuccess(decision === "accepted" ? "Offer accepted. Your application is marked as hired." : "Offer declined. The hiring team has been notified.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Offer response failed");
    } finally {
      setRespondingOffer(null);
    }
  }

  async function withdraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWithdrawing(true);
    setError("");
    setSuccess("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await api<{ application: Application }>(
        `/candidate/applications/${id}/withdraw`,
        { method: "POST", body: { reason: form.get("reason") } },
      );
      setApplication(response.application);
      setShowWithdraw(false);
      setSuccess("Application withdrawn.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Withdrawal failed");
    } finally {
      setWithdrawing(false);
    }
  }

  if (error && !application) return <Feedback tone="error">{error}</Feedback>;
  if (!application) return <LoadingBlock label="Loading application" />;
  const canWithdraw = !["Application Withdrawn", "Hired", "Not Selected", "Offer Released"].includes(application.candidate_status);
  const canRespondToOffer = offerLetter?.status === "sent" && application.candidate_status === "Offer Released";

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
      {success ? <Feedback tone="success">{success}</Feedback> : null}

      <div className="detail-grid">
        {offerLetter ? (
          <section className="panel panel-wide offer-response-panel">
            <div className="analysis-heading">
              <div>
                <h2>Offer letter</h2>
                <p>{offerLetter.role_title}{offerLetter.department ? ` | ${offerLetter.department}` : ""}</p>
              </div>
              <StatusBadge value={offerLetter.status} />
            </div>
            <dl className="detail-definition-grid">
              <div><dt>Joining date</dt><dd>{offerLetter.joining_date ? formatDate(offerLetter.joining_date) : "To be confirmed"}</dd></div>
              <div><dt>Sent</dt><dd>{offerLetter.sent_at ? formatDate(offerLetter.sent_at, true) : "Not sent"}</dd></div>
              <div><dt>Responded</dt><dd>{offerLetter.responded_at ? formatDate(offerLetter.responded_at, true) : "Pending"}</dd></div>
            </dl>
            {offerLetter.compensation_details ? <div className="answer-list"><div><strong>Compensation</strong><p>{offerLetter.compensation_details}</p></div></div> : null}
            {offerLetter.additional_terms ? <div className="answer-list"><div><strong>Additional terms</strong><p>{offerLetter.additional_terms}</p></div></div> : null}
            {canRespondToOffer ? (
              <div className="modal-actions offer-actions-inline">
                <button className="button button-primary" onClick={() => respondToOffer("accepted")} disabled={Boolean(respondingOffer)}>
                  <CheckCircle2 size={17} />
                  {respondingOffer === "accepted" ? "Accepting" : "Accept offer"}
                </button>
                <button className="button button-danger" onClick={() => respondToOffer("declined")} disabled={Boolean(respondingOffer)}>
                  <XCircle size={17} />
                  {respondingOffer === "declined" ? "Declining" : "Decline offer"}
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

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
          <a className="text-link" href={`mailto:${CAREERS_CONTACT_EMAIL}`}>
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
