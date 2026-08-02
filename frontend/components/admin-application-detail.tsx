"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3, CalendarPlus, ClipboardList, Download, ExternalLink, FileText, Mail, MessageSquare, UserPlus } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, apiUrl } from "@/lib/api";
import { formatDate, formatFileSize, humanize } from "@/lib/format";
import type { Application, User, InconsistencyFlag, OfferLetter, Assessment } from "@/lib/types";
import { Feedback, LoadingBlock, StatusBadge } from "@/components/ui";

const statuses = [
  "New",
  "Assigned for Review",
  "Under Review",
  "Shortlisted",
  "Interview Scheduled",
  "Interview Completed",
  "Offer Sent",
  "Hired",
  "Rejected",
  "Withdrawn",
];
function displayValue(value: unknown): string {
  if (value == null || value === "") return "Not provided";
  if (Array.isArray(value)) return value.map(displayValue).filter((item) => item !== "Not provided").join(", ") || "Not provided";
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, nested]) => nested != null && nested !== "")
      .map(([key, nested]) => `${humanize(key)}: ${displayValue(nested)}`)
      .join(" | ") || "Not provided";
  }
  return String(value);
}

function formatPageCount(pageCount?: number | null): string {
  if (!pageCount) return "";
  return ` | ${pageCount} ${pageCount === 1 ? "page" : "pages"}`;
}

function answerEntries(answers?: Record<string, unknown>) {
  return Object.entries(answers ?? {}).filter(([key]) => key !== "email" && key !== "email_import_message_ids");
}

function formatInterviewQuestion(item: unknown): { label: string; detail?: string } {
  if (typeof item === "string") return { label: item };
  if (item && typeof item === "object") {
    const value = item as { question?: unknown; reason?: unknown; verifies_requirement_id?: unknown };
    return {
      label: String(value.question || "Interview question"),
      detail: [value.verifies_requirement_id ? `Verifies ${value.verifies_requirement_id}` : "", value.reason ? String(value.reason) : ""].filter(Boolean).join(" - "),
    };
  }
  return { label: String(item || "Interview question") };
}

export function AdminApplicationDetail({ id }: { id: string }) {
  const [application, setApplication] = useState<Application | null>(null);
  const [reviewers, setReviewers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [inconsistency, setInconsistency] = useState<InconsistencyFlag | null>(null);
  const [detectingInconsistencies, setDetectingInconsistencies] = useState(false);
  const [offerLetter, setOfferLetter] = useState<OfferLetter | null>(null);
  const [creatingOffer, setCreatingOffer] = useState(false);
  const [offerForm, setOfferForm] = useState({ role_title: "", department: "", joining_date: "", compensation_details: "", additional_terms: "" });
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [assigningAssessment, setAssigningAssessment] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      api<{ application: Application }>(`/admin/applications/${id}`),
      api<{ users: User[] }>("/admin/users").catch(() => ({ users: [] })),
      api<{ flag: InconsistencyFlag | null }>(`/admin/applications/${id}/inconsistencies`).catch(() => ({ flag: null })),
      api<{ offer_letter: OfferLetter | null }>(`/admin/applications/${id}/offer`).catch(() => ({ offer_letter: null })),
      api<{ assessments: Assessment[] }>("/admin/assessments?status=active").catch(() => ({ assessments: [] })),
    ])
      .then(([applicationResponse, userResponse, inconsistencyResponse, offerResponse, assessmentResponse]) => {
        setApplication(applicationResponse.application);
        setReviewers(userResponse.users.filter((user) => user.role !== "candidate"));
        setInconsistency(inconsistencyResponse.flag);
        setOfferLetter(offerResponse.offer_letter);
        setAssessments(assessmentResponse.assessments);
        if (offerResponse.offer_letter) {
          setOfferForm({
            role_title: offerResponse.offer_letter.role_title,
            department: offerResponse.offer_letter.department ?? "",
            joining_date: offerResponse.offer_letter.joining_date ?? "",
            compensation_details: offerResponse.offer_letter.compensation_details ?? "",
            additional_terms: offerResponse.offer_letter.additional_terms ?? "",
          });
        }
      })
      .catch((requestError: Error) => setError(requestError.message));
  }, [id]);

  const detectInconsistencies = async () => {
    setDetectingInconsistencies(true);
    setError("");
    try {
      const resp = await api<{ flag: InconsistencyFlag }>(`/admin/applications/${id}/detect-inconsistencies`, { method: "POST" });
      setInconsistency(resp.flag);
      setSuccess("Inconsistency detection complete.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Detection failed");
    } finally {
      setDetectingInconsistencies(false);
    }
  };

  const saveOfferLetter = async () => {
    setCreatingOffer(true);
    setError("");
    try {
      const resp = await api<{ offer_letter: OfferLetter }>(`/admin/applications/${id}/offer`, {
        method: offerLetter ? "PATCH" : "POST",
        body: offerForm,
      });
      setOfferLetter(resp.offer_letter);
      setShowOfferForm(false);
      setSuccess("Offer letter saved.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save offer letter");
    } finally {
      setCreatingOffer(false);
    }
  };

  const sendOfferLetter = async () => {
    if (!offerLetter) return;
    try {
      const resp = await api<{ offer_letter: OfferLetter }>(`/admin/applications/${id}/offer/send`, { method: "POST" });
      setOfferLetter(resp.offer_letter);
      setSuccess("Offer letter sent to candidate.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send offer letter");
    }
  };

  const assignAssessment = async () => {
    if (!selectedAssessmentId) return;
    setAssigningAssessment(true);
    setError("");
    try {
      await api(`/admin/assessments/${selectedAssessmentId}/assign`, {
        method: "POST",
        body: { application_ids: [id] },
      });
      setSuccess("Assessment assigned ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â candidate will see it in their portal.");
      setSelectedAssessmentId("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to assign assessment");
    } finally {
      setAssigningAssessment(false);
    }
  };

  useEffect(load, [load]);

  async function updateStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await api<{ application: Application }>(
        `/admin/applications/${id}/status`,
        {
          method: "PATCH",
          body: {
            internal_status: form.get("internal_status"),
            note: form.get("note"),
            rejection_reason: form.get("rejection_reason") || null,
          },
        },
      );
      setApplication((current) => current ? { ...current, ...response.application } : response.application);
      setSuccess("Application status updated and candidate notification created.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Status update failed");
    } finally {
      setSaving(false);
    }
  }

  async function analyzeCandidate(force = false) {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await api<{ analysis: Application["candidate_analysis"]; created: boolean }>(`/admin/applications/${id}/analyze`, {
        method: "POST",
        body: { force },
      });
      setApplication((current) => current ? { ...current, candidate_analysis: response.analysis } : current);
      setSuccess(response.created ? "Candidate analysis completed." : "Existing analysis is already current.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Candidate analysis failed");
    } finally {
      setSaving(false);
    }
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await api(`/admin/applications/${id}/notes`, {
        method: "POST",
        body: { body: data.get("body") },
      });
      form.reset();
      setSuccess("Internal note added.");
      load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Note failed");
    } finally {
      setSaving(false);
    }
  }

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      await api(`/admin/applications/${id}/assignments`, {
        method: "POST",
        body: { reviewer_id: form.get("reviewer_id") },
      });
      setSuccess("Reviewer assigned.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Assignment failed");
    } finally {
      setSaving(false);
    }
  }

  if (!application) {
    return error ? <Feedback tone="error">{error}</Feedback> : <LoadingBlock label="Loading candidate application" />;
  }

  const detail = application.applicant_detail;
  const parsed = detail?.parsed_fields ?? {};
  const candidateProfile = application.candidate?.profile;
  const profilePhone = detail?.phone || candidateProfile?.phone;
  const profileLocation = detail?.current_city || candidateProfile?.current_city;
  const profileRole = detail?.current_role || candidateProfile?.current_role;
  const profileExperience = parsed.experience_years_detected ?? candidateProfile?.total_experience_years;
  const profileNotice = parsed.notice_period_detected || candidateProfile?.notice_period;

  return (
    <>
      <Link className="back-link" href="/admin/applications"><ArrowLeft size={17} /> Applications</Link>
      <header className="application-detail-heading admin-detail-heading">
        <div>
          <StatusBadge value={application.internal_status || application.candidate_status} />
          <h1>{application.candidate?.full_name}</h1>
          <p>{application.job.title} | Applied {formatDate(application.created_at)}</p>
        </div>
        <div className="header-actions">
          <button className="button button-primary" onClick={() => analyzeCandidate(Boolean(application.candidate_analysis))} disabled={saving}>
            <BarChart3 size={17} />
            {application.candidate_analysis ? "Refresh analysis" : "Analyze candidate"}
          </button>
          <a className="button button-secondary" href={`mailto:${application.candidate?.email}`}>
            Contact candidate
          </a>
        </div>
      </header>
      {error ? <Feedback tone="error">{error}</Feedback> : null}
      {success ? <Feedback tone="success">{success}</Feedback> : null}

      <div className="admin-detail-grid">
        <div className="admin-detail-main">
          <section className="panel candidate-summary">
            <h2>Candidate profile</h2>
            <dl className="detail-definition-grid">
              <div><dt>Email</dt><dd>{application.candidate?.email}</dd></div>
              <div><dt>Phone</dt><dd>{profilePhone || "Not provided"}</dd></div>
              <div><dt>Location</dt><dd>{profileLocation || "Not provided"}</dd></div>
              <div><dt>Current role</dt><dd>{profileRole || "Not provided"}</dd></div>
              <div><dt>Experience</dt><dd>{displayValue(profileExperience)}</dd></div>
              <div><dt>Notice period</dt><dd>{displayValue(profileNotice)}</dd></div>
            </dl>
            <div className="profile-links">
              {[
                ["LinkedIn", detail?.linkedin_url || application.candidate?.profile?.linkedin_url],
                ["GitHub", detail?.github_url || application.candidate?.profile?.github_url],
                ["Portfolio", detail?.portfolio_url || application.candidate?.profile?.portfolio_url],
              ].filter(([, href]) => href).map(([label, href]) => (
                <a href={href} target="_blank" rel="noreferrer" key={label}>{label}<ExternalLink size={15} /></a>
              ))}
            </div>
            <div className="skill-list">
              {(Array.isArray(parsed.skills) && parsed.skills.length ? parsed.skills as string[] : application.candidate?.profile?.skills ?? []).map((skill) => <span key={skill}>{skill}</span>)}
            </div>
          </section>

          {application.email ? (
            <section className="panel">
              <h2><Mail size={19} /> Original email</h2>
              <dl className="detail-definition-grid">
                <div><dt>Subject</dt><dd>{application.email.subject || "No subject"}</dd></div>
                <div><dt>From</dt><dd>{application.email.from_name || application.candidate?.full_name}<br /><small>{application.email.from_email || application.candidate?.email}</small></dd></div>
                <div><dt>Sent</dt><dd>{formatDate(application.email.sent_at, true)}</dd></div>
              </dl>
              {application.email.attachments?.length ? (
                <div className="attachment-list">
                  {application.email.attachments.map((attachment) => (
                    attachment.resume_id ? (
                      <a className="file-summary" href={apiUrl(`/resumes/${attachment.resume_id}/download`)} key={attachment.resume_id}>
                        <FileText size={22} />
                        <span><strong>{attachment.filename}</strong><small>{attachment.size_bytes ? formatFileSize(attachment.size_bytes) : "Attachment"}{formatPageCount(attachment.page_count)}</small></span>
                        <Download size={16} />
                      </a>
                    ) : (
                      <div className="file-summary" key={attachment.filename}>
                        <FileText size={22} />
                        <span><strong>{attachment.filename}</strong><small>{attachment.size_bytes ? formatFileSize(attachment.size_bytes) : "Attachment"}{formatPageCount(attachment.page_count)}</small></span>
                      </div>
                    )
                  ))}
                </div>
              ) : <p>No resume attachment was saved from this email.</p>}
            </section>
          ) : null}

          <section className="panel">
            <h2>Application content</h2>
            <h3>Message</h3>
            <p>{application.cover_message || "No cover message included."}</p>
            {answerEntries(application.answers).length ? (
              <div className="answer-list">
                {answerEntries(application.answers).map(([key, value]) => (
                  <div key={key}><strong>{humanize(key)}</strong><p>{displayValue(value)}</p></div>
                ))}
              </div>
            ) : null}
            {application.resume ? (
              <a className="file-summary" href={apiUrl(`/resumes/${application.resume.id}/download`)}>
                <FileText size={22} />
                <span><strong>{application.resume.original_filename}</strong><small>Resume version {application.resume.version} | {formatFileSize(application.resume.size_bytes)}{formatPageCount(application.resume.page_count)}</small></span>
                <Download size={16} />
              </a>
            ) : null}
          </section>

          {application.candidate_analysis ? (
            <section className="panel analysis-panel">
              <div className="analysis-heading">
                <div>
                  <h2>Candidate analysis</h2>
                  <p>{application.candidate_analysis.headline || application.candidate_analysis.recommendation || "DeepSeek analysis"}</p>
                </div>
                <strong>{application.candidate_analysis.suitability_score ?? "-"}<small>/100</small></strong>
              </div>
              {application.candidate_analysis.error ? <Feedback tone="error">{application.candidate_analysis.error}</Feedback> : null}
              <dl className="detail-definition-grid">
                <div><dt>Recommendation</dt><dd>{application.candidate_analysis.recommendation || "Not set"}</dd></div>
                <div><dt>Track</dt><dd>{application.candidate_analysis.recommended_track || "Not set"}</dd></div>
                <div><dt>Graduation</dt><dd>{application.candidate_analysis.graduation_year || "Not found"}</dd></div>
                <div><dt>Location priority</dt><dd>{application.candidate_analysis.location_priority || "Unknown"}</dd></div>
                <div><dt>Detected location</dt><dd>{application.candidate_analysis.detected_location || "Not found"}</dd></div>
                <div><dt>Confidence</dt><dd>{application.candidate_analysis.confidence_score ?? "Not set"}</dd></div>
                <div><dt>Analyzed</dt><dd>{formatDate(application.candidate_analysis.analyzed_at, true)}</dd></div>
              </dl>
              {application.candidate_analysis.summary ? <p>{application.candidate_analysis.summary}</p> : null}
              {application.candidate_analysis.job_fit?.score_breakdown ? (
                <div className="analysis-sections">
                  {Object.entries(application.candidate_analysis.job_fit.score_breakdown).map(([key, item]) => (
                    typeof item === "object" && item ? (
                      <article key={key}>
                        <strong>{humanize(key)}</strong>
                        <p>{item.score ?? 0}/{item.max ?? 0}</p>
                        {item.matched?.length ? <small>Matched: {item.matched.join(", ")}</small> : null}
                        {item.missing?.length ? <small>Missing: {item.missing.slice(0, 6).join(", ")}</small> : null}
                        {item.reasons?.length ? <small>{item.reasons.join(", ")}</small> : null}
                      </article>
                    ) : null
                  ))}
                </div>
              ) : null}
              <div className="analysis-sections">
                {[
                  ["Experience", application.candidate_analysis.experience_summary],
                  ["Projects", application.candidate_analysis.projects_summary],
                  ["Education", application.candidate_analysis.education_summary],
                  ["Fit", application.candidate_analysis.job_fit?.fit_reasoning],
                ].filter(([, body]) => body).map(([label, body]) => (
                  <article key={String(label)}><strong>{String(label)}</strong><p>{String(body)}</p></article>
                ))}
              </div>
              <div className="analysis-chip-groups">
                {[
                  ["Skills", application.candidate_analysis.skills],
                  ["Languages", application.candidate_analysis.languages],
                  ["Frameworks", application.candidate_analysis.frameworks],
                  ["Tools", application.candidate_analysis.tools],
                ].filter(([, values]) => Array.isArray(values) && values.length).map(([label, values]) => (
                  <div key={String(label)}>
                    <strong>{String(label)}</strong>
                    <div className="skill-list">{(values as string[]).map((value) => <span key={value}>{value}</span>)}</div>
                  </div>
                ))}
              </div>
              <div className="analysis-lists">
                {application.candidate_analysis.strengths?.length ? <div><strong>Strengths</strong><ul>{application.candidate_analysis.strengths.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
                {application.candidate_analysis.concerns?.length ? <div><strong>Concerns</strong><ul>{application.candidate_analysis.concerns.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
                {application.candidate_analysis.interview_questions?.length ? <div><strong>Interview questions</strong><ul>{application.candidate_analysis.interview_questions.map((item, index) => {
                  const question = formatInterviewQuestion(item);
                  return <li key={`${question.label}-${index}`}>{question.label}{question.detail ? <small>{question.detail}</small> : null}</li>;
                })}</ul></div> : null}
              </div>
            </section>
          ) : (
            <section className="panel analysis-panel empty-analysis">
              <h2>Candidate analysis</h2>
              <p>No DeepSeek analysis stored yet.</p>
              <button className="button button-primary" onClick={() => analyzeCandidate(Boolean(application.candidate_analysis))} disabled={saving}>Analyze candidate</button>
            </section>
          )}

          {application.applicant_detail ? (
            <section className="panel">
              <h2>Resume extraction</h2>
              <dl className="detail-definition-grid">
                <div><dt>Status</dt><dd>{application.applicant_detail.extraction_status}</dd></div>
                <div><dt>Phone</dt><dd>{application.applicant_detail.phone || "Not detected"}</dd></div>
                <div><dt>Location</dt><dd>{application.applicant_detail.current_city || "Not detected"}</dd></div>
                <div><dt>Role</dt><dd>{application.applicant_detail.current_role || "Not detected"}</dd></div>
                <div><dt>Experience</dt><dd>{displayValue(application.applicant_detail.parsed_fields?.experience_years_detected)}</dd></div>
                <div><dt>Notice</dt><dd>{displayValue(application.applicant_detail.parsed_fields?.notice_period_detected)}</dd></div>
                <div><dt>Resume</dt><dd>{application.applicant_detail.resume_filename || "Not linked"}</dd></div>
              </dl>
              {Array.isArray(application.applicant_detail.parsed_fields?.skills) && application.applicant_detail.parsed_fields.skills.length ? (
                <div className="skill-list">
                  {(application.applicant_detail.parsed_fields.skills as string[]).map((skill) => <span key={skill}>{skill}</span>)}
                </div>
              ) : null}
              <div className="profile-links">
                {[
                  ["LinkedIn", application.applicant_detail.linkedin_url],
                  ["GitHub", application.applicant_detail.github_url],
                  ["Portfolio", application.applicant_detail.portfolio_url],
                ].filter(([, href]) => href).map(([label, href]) => (
                  <a href={href} target="_blank" rel="noreferrer" key={label}>{label}<ExternalLink size={15} /></a>
                ))}
              </div>
              {application.applicant_detail.resume_text ? (
                <details className="resume-text-block">
                  <summary>Extracted resume text</summary>
                  <pre>{application.applicant_detail.resume_text}</pre>
                </details>
              ) : application.applicant_detail.extraction_error ? <p>{application.applicant_detail.extraction_error}</p> : null}
            </section>
          ) : null}

          {/* Inconsistency Flags ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Phase 2 */}
          <section className="panel">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={{ margin: 0 }}>Inconsistency Detection</h2>
              <button className="button button-secondary button-small" onClick={detectInconsistencies} disabled={detectingInconsistencies}>
                {detectingInconsistencies ? "DetectingÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦" : inconsistency ? "Re-run detection" : "Run detection"}
              </button>
            </div>
            {!inconsistency ? (
              <p style={{ color: "var(--muted)", fontSize: 14 }}>No inconsistency analysis run yet. Click the button to compare the candidate&apos;s submitted data against resume-extracted data.</p>
            ) : inconsistency.flags.length === 0 ? (
              <p style={{ color: "var(--success)", fontSize: 14, fontWeight: 600 }}>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ No inconsistencies detected.</p>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>{inconsistency.flags.length} potential inconsistenc{inconsistency.flags.length > 1 ? "ies" : "y"} found:</p>
                {inconsistency.flags.map((flag, i) => (
                  <div key={i} className={`inconsistency-flag ${flag.severity}`}>
                    <div className="inconsistency-field">{flag.field}</div>
                    <div className="inconsistency-detail">Expected: <strong>{flag.expected}</strong> ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Found: <strong>{flag.found}</strong></div>
                    {flag.explanation && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{flag.explanation}</div>}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <h2>Activity timeline</h2>
            <ol className="timeline">
              {(application.events || []).map((event, index) => (
                <li key={`${event.event_type}-${event.created_at}`}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{event.new_status || humanize(event.event_type)}</strong>
                    {event.note ? <p>{event.note}</p> : null}
                    <small>{formatDate(event.created_at, true)}</small>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="panel">
            <h2>Internal notes</h2>
            <form className="inline-form" onSubmit={addNote}>
              <label><span>New note</span><textarea name="body" rows={4} required /></label>
              <button className="button button-secondary" disabled={saving}>Add note</button>
            </form>
            <div className="notes-list">
              {(application.notes || []).map((note) => (
                <article key={note.id}><p>{note.body}</p><small>{formatDate(note.created_at, true)}</small></article>
              ))}
            </div>
          </section>
        </div>

        <aside className="admin-actions-rail">
          <form className="panel sticky-panel" onSubmit={updateStatus}>
            <h2>Move application</h2>
            <label>
              <span>Internal status</span>
              <select name="internal_status" defaultValue={application.internal_status}>
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label><span>Candidate-visible note</span><textarea name="note" rows={3} /></label>
            <label><span>Rejection reason (internal)</span><select name="rejection_reason" defaultValue=""><option value="">Not applicable</option><option>Skills mismatch</option><option>Experience mismatch</option><option>Role fit</option><option>Stronger candidate selected</option><option>Incomplete application</option></select></label>
            <button className="button button-primary button-wide" disabled={saving}>Update status</button>
          </form>

          <form className="panel" onSubmit={assign}>
            <h2><UserPlus size={19} /> Assign reviewer</h2>
            <select name="reviewer_id" required defaultValue="">
              <option value="" disabled>Select reviewer</option>
              {reviewers.map((reviewer) => <option value={reviewer.id} key={reviewer.id}>{reviewer.full_name}</option>)}
            </select>
            <button className="button button-secondary button-wide" disabled={saving}>Assign</button>
          </form>

          <Link className="panel quick-action" href={`/admin/interviews?application=${application.id}`}>
            <CalendarPlus size={20} />
            <span><strong>Schedule interview</strong><small>Create an invitation for this candidate.</small></span>
          </Link>

          {/* Assign Assessment ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Phase 3 */}
          <div className="panel" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <ClipboardList size={18} />
              <strong style={{ fontSize: 14 }}>Assign Assessment</strong>
            </div>
            <select
              className="field"
              style={{ marginBottom: 10 }}
              value={selectedAssessmentId}
              onChange={(e) => setSelectedAssessmentId(e.target.value)}
            >
              <option value="">ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Select active assessment ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â</option>
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>{a.title} ({a.assessment_type})</option>
              ))}
              {assessments.length === 0 && <option disabled>No active assessments</option>}
            </select>
            <button
              className="button button-secondary button-wide"
              onClick={assignAssessment}
              disabled={assigningAssessment || !selectedAssessmentId}
            >
              {assigningAssessment ? "AssigningÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦" : "Assign to candidate"}
            </button>
          </div>

          {/* AI Interview ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Phase 5 */}
          <Link className="panel quick-action" href="/admin/interviews/ai">
            <MessageSquare size={20} />
            <span><strong>Schedule Interview</strong><small>Assign a first-round interview from the Interviews page.</small></span>
          </Link>

          {/* Offer Letter ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Phase 2 */}
          <div className="panel">
            <h2>Offer Letter</h2>
            {offerLetter && !showOfferForm ? (
              <div>
                <div className={`offer-status-${offerLetter.status}`} style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>
                  Status: {offerLetter.status.toUpperCase()}
                </div>
                <dl style={{ fontSize: 13, lineHeight: 1.8 }}>
                  <div><dt style={{ fontWeight: 600 }}>Role</dt><dd>{offerLetter.role_title}</dd></div>
                  {offerLetter.department && <div><dt style={{ fontWeight: 600 }}>Department</dt><dd>{offerLetter.department}</dd></div>}
                  {offerLetter.joining_date && <div><dt style={{ fontWeight: 600 }}>Joining</dt><dd>{formatDate(offerLetter.joining_date)}</dd></div>}
                  {offerLetter.compensation_details && <div><dt style={{ fontWeight: 600 }}>Compensation</dt><dd>{offerLetter.compensation_details}</dd></div>}
                </dl>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button className="button button-secondary button-small" onClick={() => setShowOfferForm(true)}>Edit</button>
                  {offerLetter.status === "draft" && (
                    <button className="button button-primary button-small" onClick={sendOfferLetter}>Send to Candidate</button>
                  )}
                </div>
              </div>
            ) : showOfferForm || !offerLetter ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label className="field-label" style={{ fontSize: 12 }}>Role title *</label>
                  <input className="field" value={offerForm.role_title} onChange={(e) => setOfferForm(p => ({ ...p, role_title: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label" style={{ fontSize: 12 }}>Department</label>
                  <input className="field" value={offerForm.department} onChange={(e) => setOfferForm(p => ({ ...p, department: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label" style={{ fontSize: 12 }}>Joining date</label>
                  <input className="field" type="date" value={offerForm.joining_date} onChange={(e) => setOfferForm(p => ({ ...p, joining_date: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label" style={{ fontSize: 12 }}>Compensation</label>
                  <textarea className="field" rows={2} value={offerForm.compensation_details} onChange={(e) => setOfferForm(p => ({ ...p, compensation_details: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label" style={{ fontSize: 12 }}>Additional terms</label>
                  <textarea className="field" rows={2} value={offerForm.additional_terms} onChange={(e) => setOfferForm(p => ({ ...p, additional_terms: e.target.value }))} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="button button-primary button-small" onClick={saveOfferLetter} disabled={creatingOffer || !offerForm.role_title}>
                    {creatingOffer ? "SavingÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦" : "Save Draft"}
                  </button>
                  {showOfferForm && <button className="button button-ghost button-small" onClick={() => setShowOfferForm(false)}>Cancel</button>}
                </div>
              </div>
            ) : null}
            {!offerLetter && !showOfferForm && (
              <button className="button button-secondary button-wide" onClick={() => setShowOfferForm(true)}>Create Offer Letter</button>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
