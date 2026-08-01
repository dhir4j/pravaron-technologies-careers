"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, ChevronLeft, ChevronRight, Eye, FolderPlus, RefreshCw, Search, UsersRound, X, XCircle } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, apiUrl } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Application, ApplicationGroup, Job } from "@/lib/types";
import { EmptyState, Feedback, LoadingBlock, PageIntro, StatusBadge } from "@/components/ui";

type SyncSummary = {
  checked: number;
  imported: number;
  skipped_duplicate: number;
  skipped_existing_application: number;
  skipped_unrelated: number;
  skipped_unreadable: number;
  errors: string[];
  detail_rebuild?: { created_or_updated: number; failed: number; errors?: Array<{ application_id?: string; error: string }> };
};

type BatchMode = "create" | "existing";
type SourceFilter = "all" | "email" | "careers_website" | "linkedin";
type Pagination = { page: number; per_page: number; total: number; pages: number };
type ResumePreview = { url: string; title: string } | null;

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

const STATUSES = ["New", "Assigned for Review", "Under Review", "Shortlisted", "Interview Scheduled", "Offer Sent", "Hired", "Rejected", "Withdrawn"];
const SOURCE_FILTERS: Array<{ value: SourceFilter; label: string }> = [
  { value: "all", label: "All sources" },
  { value: "email", label: "Email" },
  { value: "careers_website", label: "Portal" },
  { value: "linkedin", label: "LinkedIn" },
];

function sourceKey(source?: string | null) {
  if (source === "email") return "email";
  if (source === "linkedin") return "linkedin";
  if (source === "careers_website" || !source) return "portal";
  return "other";
}

function sourceLabel(source?: string | null) {
  if (source === "email") return "Email";
  if (source === "linkedin") return "LinkedIn";
  if (source === "careers_website" || !source) return "Portal";
  return source.replace(/[_-]+/g, " ");
}

function canPreviewResume(application: Application) {
  const resume = application.resume;
  return Boolean(resume && (resume.content_type === "application/pdf" || resume.original_filename.toLowerCase().endsWith(".pdf")));
}

export function AdminApplications() {
  const [items, setItems] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [groups, setGroups] = useState<ApplicationGroup[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [jobId, setJobId] = useState("");
  const [source, setSource] = useState<SourceFilter>("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, per_page: 20, total: 0, pages: 0 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [batchMode, setBatchMode] = useState<BatchMode | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [targetGroupId, setTargetGroupId] = useState("");
  const [batchSending, setBatchSending] = useState(false);
  const [resumePreview, setResumePreview] = useState<ResumePreview>(null);
  const [resumePages, setResumePages] = useState(0);
  const [resumePage, setResumePage] = useState(1);

  const selectedCount = selectedIds.length;
  const allVisibleSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id));

  const currentQuery = useCallback((nextSearch = search, nextStatus = status, nextJobId = jobId, nextSource = source, nextPage = page) => {
    const params = new URLSearchParams();
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (nextStatus) params.set("status", nextStatus);
    if (nextJobId) params.set("job_id", nextJobId);
    if (nextSource !== "all") params.set("source", nextSource);
    params.set("page", String(nextPage));
    params.set("per_page", "20");
    return params.size ? `?${params}` : "";
  }, [jobId, page, search, source, status]);

  const load = useCallback((query = "") => {
    setLoading(true);
    api<{ applications: Application[]; pagination?: Pagination }>(`/admin/applications${query}`)
      .then((response) => {
        setItems(response.applications);
        setPagination(response.pagination ?? { page: 1, per_page: 20, total: response.applications.length, pages: 1 });
        setSelectedIds((current) => current.filter((id) => response.applications.some((item) => item.id === id)));
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const loadGroups = useCallback(() => {
    api<{ groups: ApplicationGroup[] }>("/admin/application-groups")
      .then((response) => setGroups(response.groups))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api<{ jobs: Job[] }>("/admin/jobs").then((response) => setJobs(response.jobs)).catch(() => {});
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    const timer = window.setTimeout(() => load(currentQuery()), 250);
    return () => window.clearTimeout(timer);
  }, [search, status, jobId, source, page, load, currentQuery]);

  useEffect(() => {
    setPage(1);
  }, [search, status, jobId, source]);

  const selectedApplications = useMemo(() => items.filter((item) => selectedIds.includes(item.id)), [items, selectedIds]);

  async function syncMail() {
    setSyncing(true);
    setError("");
    setSuccess("");
    try {
      const response = await api<{ sync: SyncSummary }>("/admin/applications/sync-mail", { method: "POST" });
      const sync = response.sync;
      setSuccess(`Mailbox checked ${sync.checked} messages. Imported ${sync.imported}, skipped ${sync.skipped_duplicate + sync.skipped_existing_application + sync.skipped_unrelated + sync.skipped_unreadable}.`);
      const rebuildErrors = sync.detail_rebuild?.errors?.map((item) => item.error) ?? [];
      const visibleErrors = [...(sync.errors ?? []), ...rebuildErrors];
      if (visibleErrors.length) setError(visibleErrors.slice(0, 2).join(" | "));
      load(currentQuery());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Mailbox sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function analyzeResumes() {
    setAnalyzing(true);
    setError("");
    setSuccess("");
    try {
      const response = await api<{ analysis: { checked: number; analyzed: number; cached: number; failed: number; errors: Array<{ application_id: string; error: string }> } }>("/admin/applications/analyze", { method: "POST", body: {} });
      const result = response.analysis;
      setSuccess(`Analyzed ${result.analyzed} candidates. Cached ${result.cached}, failed ${result.failed}, checked ${result.checked}.`);
      if (result.errors?.length) setError(result.errors.slice(0, 2).map((item) => item.error).join(" | "));
      load(currentQuery());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Candidate analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  async function analyzeOne(application: Application) {
    setActionId(`${application.id}:analyze`);
    setError("");
    setSuccess("");
    try {
      const response = await api<{ analysis: Application["candidate_analysis"]; created: boolean }>(`/admin/applications/${application.id}/analyze`, { method: "POST", body: {} });
      setItems((current) => current.map((item) => (item.id === application.id ? { ...item, candidate_analysis: response.analysis } : item)));
      setSuccess(response.created ? `${application.candidate?.full_name || "Applicant"} analyzed.` : `${application.candidate?.full_name || "Applicant"} already has current analysis.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Candidate analysis failed");
    } finally {
      setActionId("");
    }
  }

  async function decide(application: Application, nextStatus: "Shortlisted" | "Rejected") {
    setActionId(`${application.id}:${nextStatus}`);
    setError("");
    setSuccess("");
    try {
      const response = await api<{ application: Application }>(`/admin/applications/${application.id}/status`, {
        method: "PATCH",
        body: {
          internal_status: nextStatus,
          note: nextStatus === "Shortlisted" ? "Applicant approved for the next stage." : "Applicant rejected from the applications queue.",
          rejection_reason: nextStatus === "Rejected" ? "Role fit" : null,
        },
      });
      setItems((current) => current.map((item) => (item.id === application.id ? { ...item, ...response.application } : item)));
      setSuccess(`${application.candidate?.full_name || "Applicant"} moved to ${nextStatus}.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Status update failed");
    } finally {
      setActionId("");
    }
  }

  function toggleRow(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAllVisible() {
    setSelectedIds((current) => allVisibleSelected ? current.filter((id) => !items.some((item) => item.id === id)) : Array.from(new Set([...current, ...items.map((item) => item.id)])));
  }

  function openBatch(mode: BatchMode) {
    setBatchMode(mode);
    setGroupName("");
    setGroupDescription("");
    setTargetGroupId(groups[0]?.id ?? "");
    setError("");
    setSuccess("");
  }

  function openResumePreview(application: Application) {
    if (!application.resume) return;
    setResumePages(0);
    setResumePage(1);
    setResumePreview({
      url: apiUrl(`/resumes/${application.resume.id}/download?disposition=inline`),
      title: application.resume.original_filename,
    });
  }

  async function submitBatch() {
    if (!batchMode || !selectedIds.length) return;
    if (batchMode === "create" && !groupName.trim()) { setError("Group name is required."); return; }
    if (batchMode === "existing" && !targetGroupId) { setError("Select an existing group."); return; }
    setBatchSending(true);
    setError("");
    setSuccess("");
    try {
      let addedCount = 0;
      if (batchMode === "create") {
        const created = await api<{ group: ApplicationGroup; added_application_ids?: string[] }>("/admin/application-groups", {
          method: "POST",
          body: { name: groupName.trim(), description: groupDescription.trim(), application_ids: selectedIds },
        });
        addedCount = created.added_application_ids?.length ?? 0;
      } else {
        const added = await api<{ group: ApplicationGroup; added: number; added_application_ids?: string[] }>(`/admin/application-groups/${targetGroupId}/members`, { method: "POST", body: { application_ids: selectedIds } });
        addedCount = added.added_application_ids?.length ?? added.added ?? 0;
      }
      setSuccess(addedCount ? `Group saved with ${addedCount} applicant${addedCount === 1 ? "" : "s"}.` : "Group already had the selected applicants.");
      setBatchMode(null);
      setSelectedIds([]);
      loadGroups();
      load(currentQuery());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Group save failed");
    } finally {
      setBatchSending(false);
    }
  }

  return (
    <>
      <PageIntro title="Applications" body="Filter applications, review source labels, and create applicant groups from the queue." />
      {error ? <Feedback tone="error">{error}</Feedback> : null}
      {success ? <Feedback tone="success">{success}</Feedback> : null}

      <div className="admin-filter-bar application-filter-bar">
        <label className="search-field"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Candidate, email, or application ID" /></label>
        <select value={jobId} onChange={(event) => setJobId(event.target.value)} aria-label="Filter by job">
          <option value="">All jobs</option>
          {jobs.map((job) => <option value={job.id} key={job.id}>{job.title}</option>)}
        </select>
        <select value={source} onChange={(event) => setSource(event.target.value as SourceFilter)} aria-label="Filter by source">
          {SOURCE_FILTERS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((value) => <option key={value}>{value}</option>)}
        </select>
        <button className="button button-primary" onClick={syncMail} disabled={syncing}><RefreshCw size={17} />{syncing ? "Syncing" : "Sync mail"}</button>
        <button className="button button-secondary" onClick={analyzeResumes} disabled={analyzing}>{analyzing ? "Analyzing" : "Analyze resumes"}</button>
      </div>

      {selectedCount ? (
        <div className="bulk-action-bar">
          <div><strong>{selectedCount}</strong><span> applicant{selectedCount === 1 ? "" : "s"} selected</span></div>
          <div>
            <button className="button button-secondary button-small" onClick={() => openBatch("create")}><FolderPlus size={15} /> Create group</button>
            <button className="button button-primary button-small" onClick={() => openBatch("existing")} disabled={!groups.length}><UsersRound size={15} /> Add to existing group</button>
            <button className="icon-button" onClick={() => setSelectedIds([])} aria-label="Clear selection"><X size={16} /></button>
          </div>
        </div>
      ) : null}

      {loading ? <LoadingBlock label="Loading applications" /> : items.length ? (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table selectable-table">
              <thead><tr><th><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Select all visible applications" /></th><th>Candidate</th><th>Role</th><th>Status</th><th>Track</th><th>Score</th><th>Applied</th><th>Source</th><th>Resume</th><th>Decision</th><th><span className="sr-only">Open</span></th></tr></thead>
              <tbody>
                {items.map((application) => {
                  const isFinal = ["Rejected", "Hired", "Withdrawn"].includes(application.internal_status || "");
                  const selected = selectedIds.includes(application.id);
                  return (
                    <tr key={application.id} className={selected ? "selected" : ""}>
                      <td><input type="checkbox" checked={selected} onChange={() => toggleRow(application.id)} aria-label={`Select ${application.candidate?.full_name || "applicant"}`} /></td>
                      <td><strong>{application.candidate?.full_name}</strong></td>
                      <td><strong>{application.job.title}</strong><small>{application.job.public_code}</small></td>
                      <td><StatusBadge value={application.internal_status || application.candidate_status} /></td>
                      <td><strong>{application.candidate_analysis?.recommended_track || "-"}</strong><small>{[application.candidate_analysis?.graduation_year, application.candidate_analysis?.location_priority].filter(Boolean).join(" | ")}</small></td>
                      <td>{application.candidate_analysis?.suitability_score ?? "-"}</td>
                      <td>{formatDate(application.created_at)}</td>
                      <td><span className={`source-pill source-pill-${sourceKey(application.source)}`}>{sourceLabel(application.source)}</span></td>
                      <td><button className="icon-button" title="Preview resume" aria-label="Preview resume" onClick={() => openResumePreview(application)} disabled={!canPreviewResume(application)}><Eye size={17} /></button></td>
                      <td><div className="table-actions"><button className="icon-button" title="Analyze applicant" aria-label="Analyze applicant" onClick={() => analyzeOne(application)} disabled={Boolean(actionId)}><BarChart3 size={17} /></button><button className="icon-button success" title="Approve applicant" aria-label="Approve applicant" onClick={() => decide(application, "Shortlisted")} disabled={isFinal || Boolean(actionId)}><CheckCircle2 size={17} /></button><button className="icon-button danger" title="Reject applicant" aria-label="Reject applicant" onClick={() => decide(application, "Rejected")} disabled={isFinal || Boolean(actionId)}><XCircle size={17} /></button></div></td>
                      <td><Link className="icon-button" href={`/admin/applications/${application.id}`}><ArrowRight size={17} /></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pagination.pages > 1 ? (
            <div className="pagination-bar">
            <button className="icon-button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={pagination.page <= 1} aria-label="Previous page"><ChevronLeft size={17} /></button>
            {Array.from({ length: pagination.pages }, (_, index) => index + 1)
              .filter((value) => value === 1 || value === pagination.pages || Math.abs(value - pagination.page) <= 2)
              .map((value, index, values) => (
                <span key={value} className="pagination-item-wrap">
                  {index > 0 && value - values[index - 1] > 1 ? <span className="pagination-gap">...</span> : null}
                  <button className={`pagination-page ${value === pagination.page ? "active" : ""}`} onClick={() => setPage(value)}>{value}</button>
                </span>
              ))}
            <button className="icon-button" onClick={() => setPage((value) => Math.min(pagination.pages, value + 1))} disabled={pagination.page >= pagination.pages} aria-label="Next page"><ChevronRight size={17} /></button>
            <span className="pagination-count">{pagination.total} unique applicants</span>
            </div>
          ) : null}
        </>
      ) : <EmptyState title="No applications found" body="Sync the mailbox or adjust the filters to find submissions." />}

      {batchMode ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="batch-email-dialog">
            <div className="batch-email-head">
              <div><h2>{batchMode === "create" ? "Create group" : "Add to group"}</h2><p>{selectedCount} selected applicant{selectedCount === 1 ? "" : "s"}</p></div>
              <button className="icon-button" onClick={() => setBatchMode(null)} aria-label="Close"><X size={17} /></button>
            </div>
            <div className="batch-email-grid">
              <div className="batch-email-form">
                {batchMode === "create" ? (
                  <>
                    <label><span>Group name</span><input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="e.g. Frontend shortlist July" autoFocus /></label>
                    <label><span>Description</span><textarea rows={5} value={groupDescription} onChange={(event) => setGroupDescription(event.target.value)} placeholder="Optional group note" /></label>
                  </>
                ) : (
                  <label><span>Existing group</span><select value={targetGroupId} onChange={(event) => setTargetGroupId(event.target.value)}>{groups.map((group) => <option value={group.id} key={group.id}>{group.name} ({group.member_count})</option>)}</select></label>
                )}
              </div>
              <aside className="batch-email-preview">
                <h3>Recipients</h3>
                {selectedApplications.slice(0, 8).map((application) => <div key={application.id}><strong>{application.candidate?.full_name}</strong><span>{application.candidate?.email}</span><small>{application.job.title}</small></div>)}
                {selectedApplications.length > 8 ? <p>+{selectedApplications.length - 8} more</p> : null}
              </aside>
            </div>
            <div className="batch-email-actions"><button className="button button-secondary" onClick={() => setBatchMode(null)}>Cancel</button><button className="button button-primary" onClick={submitBatch} disabled={batchSending}>{batchSending ? "Saving" : "Save group"}</button></div>
          </section>
        </div>
      ) : null}

      {resumePreview ? (
        <div className="modal-backdrop resume-preview-backdrop" role="dialog" aria-modal="true">
          <section className="resume-preview-dialog">
            <div className="resume-preview-head">
              <div><h2>Resume preview</h2><p>{resumePreview.title}</p></div>
              <button className="icon-button" onClick={() => setResumePreview(null)} aria-label="Close resume preview"><X size={17} /></button>
            </div>
            <div className="resume-preview-toolbar">
              <button className="icon-button" onClick={() => setResumePage((value) => Math.max(1, value - 1))} disabled={resumePage <= 1} aria-label="Previous resume page"><ChevronLeft size={17} /></button>
              <span>{resumePages ? `Page ${resumePage} of ${resumePages}` : "Loading"}</span>
              <button className="icon-button" onClick={() => setResumePage((value) => Math.min(resumePages || value, value + 1))} disabled={!resumePages || resumePage >= resumePages} aria-label="Next resume page"><ChevronRight size={17} /></button>
            </div>
            <div className="resume-preview-canvas">
              <Document
                file={{ url: resumePreview.url, withCredentials: true } as { url: string }}
                loading={<LoadingBlock label="Loading resume" />}
                error={<Feedback tone="error">Resume preview failed. Use download from the detail page.</Feedback>}
                onLoadSuccess={({ numPages }) => setResumePages(numPages)}
              >
                <Page pageNumber={resumePage} width={820} renderTextLayer={false} renderAnnotationLayer={false} />
              </Document>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
