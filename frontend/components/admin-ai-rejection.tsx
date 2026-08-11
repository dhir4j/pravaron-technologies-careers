"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { AIRejectionReview, AIRejectionRuleSet, Application, Job } from "@/lib/types";
import { EmptyState, Feedback, LoadingBlock, Metric, PageIntro, StatusBadge } from "@/components/ui";

type SourceFilter = "all" | "email" | "careers_website" | "linkedin";
type Pagination = { page: number; per_page: number; total: number; pages: number };
type ReviewSummary = {
  checked: number;
  suggested_reject: number;
  safe_to_confirm: number;
  manual_review: number;
  do_not_reject: number;
  failed: number;
  errors: Array<{ application_id?: string; error: string }>;
  review_ids: string[];
};
type ConfirmationSummary = {
  checked: number;
  rejected: number;
  skipped: number;
  failed: number;
  errors: Array<{ review_id?: string; application_id?: string; error: string }>;
  applications: Application[];
  confirmed_review_ids: string[];
  skipped_review_ids: string[];
};
type ProcessLog = {
  id: string;
  status: "running" | "success" | "error" | "info";
  title: string;
  detail?: string;
};
type ProcessProgress = {
  visible: boolean;
  total: number;
  completed: number;
  currentName: string;
  currentStep: string;
  logs: ProcessLog[];
};

const SOURCE_FILTERS: Array<{ value: SourceFilter; label: string }> = [
  { value: "all", label: "All sources" },
  { value: "email", label: "Email" },
  { value: "careers_website", label: "Portal" },
  { value: "linkedin", label: "LinkedIn" },
];
const AI_REJECTION_STATUS = "New";
const AI_REJECTION_PER_PAGE = 20;

function sourceLabel(source?: string | null) {
  if (source === "email") return "Email";
  if (source === "linkedin") return "LinkedIn";
  if (source === "careers_website" || !source) return "Portal";
  return source.replace(/[_-]+/g, " ");
}

function recommendationLabel(value: AIRejectionReview["recommendation"]) {
  if (value === "suggest_reject") return "Suggest reject";
  if (value === "do_not_reject") return "Do not reject";
  return "Manual review";
}

function reviewBadgeValue(review: AIRejectionReview) {
  if (review.status === "confirmed") return "Rejected";
  if (review.status === "skipped") return "Skipped";
  if (review.status === "failed") return "Failed";
  return recommendationLabel(review.recommendation);
}

function isSelectableReview(review: AIRejectionReview) {
  return review.status === "suggested" && review.recommendation === "suggest_reject" && review.safe_to_confirm && Boolean(review.detected_email);
}

function buildReviewSummary(reviews: AIRejectionReview[], checked: number, errors: ReviewSummary["errors"] = []): ReviewSummary {
  return {
    checked,
    suggested_reject: reviews.filter((review) => review.recommendation === "suggest_reject").length,
    safe_to_confirm: reviews.filter((review) => review.safe_to_confirm).length,
    manual_review: reviews.filter((review) => review.recommendation === "manual_review").length,
    do_not_reject: reviews.filter((review) => review.recommendation === "do_not_reject").length,
    failed: reviews.filter((review) => review.status === "failed").length + errors.length,
    errors,
    review_ids: reviews.map((review) => review.id),
  };
}

export function AdminAIRejection() {
  const [items, setItems] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [ruleset, setRuleset] = useState<AIRejectionRuleSet | null>(null);
  const [reviews, setReviews] = useState<AIRejectionReview[]>([]);
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [jobId, setJobId] = useState("");
  const [source, setSource] = useState<SourceFilter>("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, per_page: 20, total: 0, pages: 0 });
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [rulePrompt, setRulePrompt] = useState("");
  const [ruleName, setRuleName] = useState("");
  const [minimumConfidence, setMinimumConfidence] = useState(70);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processProgress, setProcessProgress] = useState<ProcessProgress>({
    visible: false,
    total: 0,
    completed: 0,
    currentName: "",
    currentStep: "",
    logs: [],
  });

  const currentQuery = useCallback((nextSearch = search, nextJobId = jobId, nextSource = source, nextPage = page) => {
    const params = new URLSearchParams();
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    params.set("status", AI_REJECTION_STATUS);
    if (nextJobId) params.set("job_id", nextJobId);
    if (nextSource !== "all") params.set("source", nextSource);
    params.set("page", String(nextPage));
    params.set("per_page", String(AI_REJECTION_PER_PAGE));
    return `?${params}`;
  }, [jobId, page, search, source]);

  const selectableReviewIds = useMemo(() => reviews.filter(isSelectableReview).map((review) => review.id), [reviews]);
  const selectedReviewCount = selectedReviewIds.length;
  const allSelectableChecked = selectableReviewIds.length > 0 && selectableReviewIds.every((id) => selectedReviewIds.includes(id));
  const reviewableItems = useMemo(() => items.filter((item) => (item.internal_status || item.candidate_status) === AI_REJECTION_STATUS), [items]);

  const loadApplications = useCallback((query = "", showSpinner = true) => {
    if (showSpinner) setLoading(true);
    api<{ applications: Application[]; pagination?: Pagination }>(`/admin/applications${query}`)
      .then((response) => {
        setItems(response.applications);
        setPagination(response.pagination ?? { page: 1, per_page: 20, total: response.applications.length, pages: 1 });
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => {
        if (showSpinner) setLoading(false);
      });
  }, []);

  const loadRules = useCallback(() => {
    api<{ ruleset: AIRejectionRuleSet }>("/admin/ai-rejection-rules")
      .then((response) => {
        setRuleset(response.ruleset);
        setRuleName(response.ruleset.name);
        setRulePrompt(response.ruleset.system_prompt);
        setMinimumConfidence(response.ruleset.minimum_confidence);
      })
      .catch((requestError: Error) => setError(requestError.message));
  }, []);

  useEffect(() => {
    api<{ jobs: Job[] }>("/admin/jobs").then((response) => setJobs(response.jobs)).catch(() => {});
    loadRules();
  }, [loadRules]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadApplications(currentQuery()), 250);
    return () => window.clearTimeout(timer);
  }, [search, jobId, source, page, loadApplications, currentQuery]);

  useEffect(() => {
    if (processing || confirming || settingsOpen) return;
    const syncQueue = () => loadApplications(currentQuery(), false);
    window.addEventListener("focus", syncQueue);
    const timer = window.setInterval(syncQueue, 30000);
    return () => {
      window.removeEventListener("focus", syncQueue);
      window.clearInterval(timer);
    };
  }, [confirming, currentQuery, loadApplications, processing, settingsOpen]);

  useEffect(() => {
    setPage(1);
  }, [search, jobId, source]);

  useEffect(() => {
    setReviews([]);
    setSelectedReviewIds([]);
    setSummary(null);
  }, [search, jobId, source, page]);

  async function saveRules() {
    setSavingSettings(true);
    setError("");
    setSuccess("");
    try {
      const response = await api<{ ruleset: AIRejectionRuleSet }>("/admin/ai-rejection-rules", {
        method: "PUT",
        body: {
          name: ruleName,
          system_prompt: rulePrompt,
          minimum_confidence: minimumConfidence,
        },
      });
      setRuleset(response.ruleset);
      setSettingsOpen(false);
      setSuccess("AI rejection rules saved.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Saving rules failed");
    } finally {
      setSavingSettings(false);
    }
  }

  async function processCurrentPage() {
    if (!reviewableItems.length) return;
    setProcessing(true);
    setError("");
    setSuccess("");
    setReviews([]);
    setSelectedReviewIds([]);
    setSummary(buildReviewSummary([], 0));
    setProcessProgress({
      visible: true,
      total: reviewableItems.length,
      completed: 0,
      currentName: "Preparing current page",
      currentStep: "Starting resume extraction and DeepSeek review.",
      logs: [{ id: "start", status: "info", title: "Queued current page", detail: `${reviewableItems.length} applications ready for processing.` }],
    });
    const nextReviews: AIRejectionReview[] = [];
    const nextErrors: ReviewSummary["errors"] = [];
    try {
      for (let index = 0; index < reviewableItems.length; index += 1) {
        const application = reviewableItems[index];
        const candidateName = application.candidate?.full_name || "Candidate";
        setProcessProgress((current) => ({
          ...current,
          currentName: candidateName,
          currentStep: `Extracting resume text and asking DeepSeek (${index + 1}/${reviewableItems.length}).`,
          logs: [
            { id: `${application.id}:running`, status: "running", title: candidateName, detail: "Extracting PDF/resume data and generating suggestion." },
            ...current.logs.filter((item) => item.id !== `${application.id}:running`).slice(0, 8),
          ],
        }));
        try {
          const response = await api<{ review: ReviewSummary; ruleset: AIRejectionRuleSet; reviews: AIRejectionReview[] }>("/admin/applications/rejection-review", {
            method: "POST",
            body: { application_ids: [application.id] },
          });
          setRuleset(response.ruleset);
          nextReviews.push(...response.reviews);
          nextErrors.push(...(response.review.errors || []));
          const latestReview = response.reviews[0];
          const statusText = latestReview
            ? `${recommendationLabel(latestReview.recommendation)} · ${latestReview.confidence_score}% confidence`
            : "No suggestion returned";
          setReviews([...nextReviews]);
          setSelectedReviewIds(nextReviews.filter(isSelectableReview).map((review) => review.id));
          setSummary(buildReviewSummary(nextReviews, index + 1, nextErrors));
          setProcessProgress((current) => ({
            ...current,
            completed: index + 1,
            currentStep: `Completed ${index + 1} of ${reviewableItems.length}.`,
            logs: [
              { id: `${application.id}:done`, status: latestReview?.safe_to_confirm ? "success" : "info", title: candidateName, detail: statusText },
              ...current.logs.filter((item) => item.id !== `${application.id}:running`).slice(0, 8),
            ],
          }));
        } catch (requestError) {
          const message = requestError instanceof Error ? requestError.message : "AI rejection review failed";
          nextErrors.push({ application_id: application.id, error: message });
          setSummary(buildReviewSummary(nextReviews, index + 1, nextErrors));
          setProcessProgress((current) => ({
            ...current,
            completed: index + 1,
            currentStep: `Completed ${index + 1} of ${reviewableItems.length}.`,
            logs: [
              { id: `${application.id}:error`, status: "error", title: candidateName, detail: message },
              ...current.logs.filter((item) => item.id !== `${application.id}:running`).slice(0, 8),
            ],
          }));
        }
      }
      const finalSummary = buildReviewSummary(nextReviews, reviewableItems.length, nextErrors);
      setSummary(finalSummary);
      if (finalSummary.errors.length) {
        setError(finalSummary.errors.slice(0, 2).map((item) => item.error).join(" | "));
      }
      setSuccess(`Processed ${finalSummary.checked} applications. ${finalSummary.safe_to_confirm} suggested rejection${finalSummary.safe_to_confirm === 1 ? "" : "s"} ready.`);
      setProcessProgress((current) => ({
        ...current,
        completed: reviewableItems.length,
        currentName: "Processing complete",
        currentStep: `${finalSummary.safe_to_confirm} confirmable suggestions, ${finalSummary.manual_review} manual review, ${finalSummary.failed} failed.`,
      }));
    } finally {
      setProcessing(false);
    }
  }

  async function confirmSelected() {
    if (!selectedReviewIds.length) return;
    setConfirming(true);
    setError("");
    setSuccess("");
    const selectedBeforeConfirm = [...selectedReviewIds];
    const uncheckedSafeReviews = reviews.filter((review) => isSelectableReview(review) && !selectedBeforeConfirm.includes(review.id)).map((review) => review.id);
    try {
      const response = await api<{ confirmation: ConfirmationSummary }>("/admin/applications/rejection-review/confirm", {
        method: "POST",
        body: { review_ids: selectedBeforeConfirm },
      });
      const confirmation = response.confirmation;
      const confirmed = new Set(confirmation.confirmed_review_ids);
      const skipped = new Set([...confirmation.skipped_review_ids, ...uncheckedSafeReviews]);
      const applicationById = new Map(confirmation.applications.map((application) => [application.id, application]));
      setReviews((current) => current.map((review) => {
        if (confirmed.has(review.id)) {
          return {
            ...review,
            status: "confirmed",
            safe_to_confirm: false,
            application: applicationById.get(review.application_id) ?? review.application,
          };
        }
        if (skipped.has(review.id)) {
          return { ...review, status: "skipped", safe_to_confirm: false };
        }
        return review;
      }).filter((review) => review.status !== "confirmed"));
      setSelectedReviewIds([]);
      setSuccess(`Rejected ${confirmation.rejected}. Skipped ${confirmation.skipped + uncheckedSafeReviews.length}. Failed ${confirmation.failed}.`);
      if (confirmation.errors?.length) setError(confirmation.errors.slice(0, 2).map((item) => item.error).join(" | "));
      setItems((current) => current.filter((application) => !confirmation.applications.some((updated) => updated.id === application.id && updated.internal_status === "Rejected")));
      loadApplications(currentQuery());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Confirmation failed");
    } finally {
      setConfirming(false);
    }
  }

  function toggleReview(id: string) {
    setSelectedReviewIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAllSelectable() {
    setSelectedReviewIds((current) => {
      if (allSelectableChecked) return current.filter((id) => !selectableReviewIds.includes(id));
      return Array.from(new Set([...current, ...selectableReviewIds]));
    });
  }

  function openSettings() {
    if (ruleset) {
      setRuleName(ruleset.name);
      setRulePrompt(ruleset.system_prompt);
      setMinimumConfidence(ruleset.minimum_confidence);
    }
    setSettingsOpen(true);
  }

  return (
    <>
      <PageIntro
        eyebrow="DeepSeek"
        title="AI Rejection Review"
        body="Page-by-page rejection suggestions with confirmation gates."
        action={<button className="button button-secondary" onClick={openSettings}><Settings size={17} />Settings</button>}
      />
      {error ? <Feedback tone="error">{error}</Feedback> : null}
      {success ? <Feedback tone="success">{success}</Feedback> : null}

      <div className="admin-filter-bar ai-rejection-filter-bar">
        <label className="search-field"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Candidate, email, or application ID" /></label>
        <select value={jobId} onChange={(event) => setJobId(event.target.value)} aria-label="Filter by job">
          <option value="">All jobs</option>
          {jobs.map((job) => <option value={job.id} key={job.id}>{job.title}</option>)}
        </select>
        <select value={source} onChange={(event) => setSource(event.target.value as SourceFilter)} aria-label="Filter by source">
          {SOURCE_FILTERS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
        </select>
        <span className="ai-fixed-status"><CheckCircle2 size={16} />New only</span>
        <button className="button button-secondary" onClick={() => loadApplications(currentQuery())} disabled={loading}><RefreshCw size={17} />Refresh</button>
        <button className="button button-primary" onClick={processCurrentPage} disabled={processing || loading || !reviewableItems.length}><Sparkles size={17} />{processing ? "Processing" : "Process page"}</button>
      </div>

      <div className="metric-grid ai-rejection-metrics">
        <Metric label="New applications on page" value={reviewableItems.length} detail={`${pagination.total} total new`} />
        <Metric label="Suggested reject" value={summary?.suggested_reject ?? 0} detail={`${summary?.safe_to_confirm ?? 0} confirmable`} />
        <Metric label="Manual review" value={summary?.manual_review ?? 0} detail={`${summary?.failed ?? 0} failed`} />
      </div>

      {loading ? <LoadingBlock label="Loading applications" /> : (
        <section className="ai-review-section">
          <div className="panel-heading">
            <div><Bot size={18} /><h2>Current Page</h2></div>
            <span className="muted-copy">Page {pagination.page} of {pagination.pages || 1} · {AI_REJECTION_PER_PAGE} per page · New only</span>
          </div>
          {reviewableItems.length ? (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Candidate</th><th>Role</th><th>Status</th><th>Email</th><th>Applied</th><th><span className="sr-only">Open</span></th></tr></thead>
                  <tbody>
                    {reviewableItems.map((application) => (
                      <tr key={application.id}>
                        <td><strong>{application.candidate?.full_name || "Candidate"}</strong><small>{sourceLabel(application.source)}</small></td>
                        <td><strong>{application.job?.title}</strong><small>{application.job?.public_code}</small></td>
                        <td><StatusBadge value={application.internal_status || application.candidate_status} /></td>
                        <td>{application.applicant_detail?.email || application.candidate?.email || "-"}</td>
                        <td>{formatDate(application.created_at)}</td>
                        <td><Link className="button button-secondary button-small" href={`/admin/applications/${application.id}`}>Open</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination.pages > 1 ? (
                <div className="pagination-bar">
                  <button className="icon-button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={pagination.page <= 1} aria-label="Previous page"><ChevronLeft size={17} /></button>
                  <span className="pagination-count">{pagination.total} applications</span>
                  <button className="icon-button" onClick={() => setPage((value) => Math.min(pagination.pages, value + 1))} disabled={pagination.page >= pagination.pages} aria-label="Next page"><ChevronRight size={17} /></button>
                </div>
              ) : null}
            </>
          ) : <EmptyState title="No new applications found" body="Shortlisted and rejected applications are hidden from this AI rejection queue." />}
        </section>
      )}

      <section className="ai-review-section ai-review-results">
        <div className="panel-heading">
          <div><CheckCircle2 size={18} /><h2>Suggestions</h2></div>
          <button className="button button-primary button-small" onClick={confirmSelected} disabled={confirming || !selectedReviewCount}>
            {confirming ? "Confirming" : `Confirm selected (${selectedReviewCount})`}
          </button>
        </div>
        {reviews.length ? (
          <>
            <div className="bulk-action-bar">
              <div><strong>{selectedReviewCount}</strong><span>selected for rejection</span></div>
              <div>
                <button className="button button-secondary button-small" onClick={toggleAllSelectable} disabled={!selectableReviewIds.length}>
                  {allSelectableChecked ? "Uncheck all" : "Check all suggested"}
                </button>
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table selectable-table ai-review-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" checked={allSelectableChecked} onChange={toggleAllSelectable} disabled={!selectableReviewIds.length} aria-label="Select all confirmable suggestions" /></th>
                    <th>Candidate</th>
                    <th>Suggestion</th>
                    <th>Confidence</th>
                    <th>Email</th>
                    <th>Reasons</th>
                    <th>Evidence</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => {
                    const selectable = isSelectableReview(review);
                    const checked = selectedReviewIds.includes(review.id);
                    const application = review.application;
                    return (
                      <tr key={review.id} className={checked ? "selected" : ""}>
                        <td>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!selectable}
                            onChange={() => toggleReview(review.id)}
                            aria-label={`Select ${application?.candidate?.full_name || "candidate"} for rejection`}
                          />
                        </td>
                        <td><strong>{application?.candidate?.full_name || "Candidate"}</strong><small>{application?.job?.title}</small></td>
                        <td><StatusBadge value={recommendationLabel(review.recommendation)} /></td>
                        <td><strong>{review.confidence_score}%</strong><small>Email {review.email_confidence}%</small></td>
                        <td><strong className="ai-email">{review.detected_email || "Needs review"}</strong><small>{review.email_source || "unknown"}</small></td>
                        <td>{review.reasons.length ? review.reasons.slice(0, 3).map((reason) => <span className="ai-review-chip" key={reason}>{reason}</span>) : <span className="muted-copy">No reason returned</span>}</td>
                        <td>
                          {review.error ? <span className="ai-review-warning"><AlertTriangle size={14} />{review.error}</span> : null}
                          {review.risk_flags.length ? <span className="ai-review-warning"><AlertTriangle size={14} />{review.risk_flags[0]}</span> : null}
                          {!review.error && !review.risk_flags.length && review.evidence.length ? <small>{review.evidence[0].text}</small> : null}
                        </td>
                        <td><StatusBadge value={reviewBadgeValue(review)} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : <EmptyState title="No suggestions yet" body="Process the current page to generate review rows." />}
      </section>

      {settingsOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="ai-rules-dialog">
            <div className="batch-email-head">
              <div><h2>AI rejection settings</h2><p>{ruleset?.updated_at ? `Last saved ${formatDate(ruleset.updated_at)}` : "Default rules"}</p></div>
              <button className="icon-button" onClick={() => setSettingsOpen(false)} aria-label="Close settings"><X size={17} /></button>
            </div>
            <div className="ai-rules-form">
              <label><span>Name</span><input value={ruleName} onChange={(event) => setRuleName(event.target.value)} /></label>
              <label><span>Minimum confidence</span><input type="number" min={0} max={100} value={minimumConfidence} onChange={(event) => setMinimumConfidence(Number(event.target.value))} /></label>
              <label><span>System prompt</span><textarea rows={16} value={rulePrompt} onChange={(event) => setRulePrompt(event.target.value)} /></label>
            </div>
            <div className="batch-email-actions">
              <button className="button button-secondary" onClick={() => setSettingsOpen(false)}>Cancel</button>
              <button className="button button-primary" onClick={saveRules} disabled={savingSettings}>{savingSettings ? "Saving" : "Save settings"}</button>
            </div>
          </section>
        </div>
      ) : null}

      {processProgress.visible ? (
        <aside className="ai-process-window" role="status" aria-live="polite">
          <div className="ai-process-head">
            <div>
              <strong>{processing ? "Processing page" : "Process status"}</strong>
              <span>{processProgress.currentName}</span>
            </div>
            <button className="icon-button" onClick={() => setProcessProgress((current) => ({ ...current, visible: false }))} aria-label="Close process status"><X size={15} /></button>
          </div>
          <div className="ai-process-meter">
            <span style={{ width: `${processProgress.total ? Math.round((processProgress.completed / processProgress.total) * 100) : 0}%` }} />
          </div>
          <div className="ai-process-copy">
            <strong>{processProgress.completed}/{processProgress.total}</strong>
            <span>{processProgress.currentStep}</span>
          </div>
          <div className="ai-process-log">
            {processProgress.logs.map((item) => (
              <div className={`ai-process-log-row ai-process-log-${item.status}`} key={item.id}>
                {item.status === "running" ? <LoaderCircle className="spin" size={14} /> : item.status === "error" ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                <span><strong>{item.title}</strong>{item.detail ? <small>{item.detail}</small> : null}</span>
              </div>
            ))}
          </div>
        </aside>
      ) : null}
    </>
  );
}
