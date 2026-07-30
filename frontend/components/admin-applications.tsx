"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, FolderPlus, Mail, RefreshCw, Search, UsersRound, X, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
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

const STATUSES = ["New", "Assigned for Review", "Under Review", "Shortlisted", "Interview Scheduled", "Offer Sent", "Hired", "Rejected", "Withdrawn"];
const SOURCE_FILTERS: Array<{ value: SourceFilter; label: string }> = [
  { value: "all", label: "All sources" },
  { value: "email", label: "Email" },
  { value: "careers_website", label: "Portal" },
  { value: "linkedin", label: "LinkedIn" },
];

const defaultBatchEmail = {
  purpose: "Application update",
  status_to_apply: "Shortlisted",
  subject: "Update on your application for {{job_title}}",
  text_body: "Hi {{candidate_name}},\n\nThank you for applying for {{job_title}} at Pravaron Technologies. Your application status is now {{application_status}}.\n\nPlease check your dashboard for details: {{application_url}}\n\nRegards,\nPravaron Careers Team",
  html_body: "<p>Hi {{candidate_name}},</p><p>Thank you for applying for <strong>{{job_title}}</strong> at Pravaron Technologies.</p><p>Your application status is now <strong>{{application_status}}</strong>.</p><p><a href=\"{{application_url}}\">Open your application dashboard</a></p><p>Regards,<br />Pravaron Careers Team</p>",
};

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

export function AdminApplications() {
  const [items, setItems] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [groups, setGroups] = useState<ApplicationGroup[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [jobId, setJobId] = useState("");
  const [source, setSource] = useState<SourceFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [batchMode, setBatchMode] = useState<BatchMode | null>(null);
  const [groupName, setGroupName] = useState("");
  const [targetGroupId, setTargetGroupId] = useState("");
  const [batchEmail, setBatchEmail] = useState(defaultBatchEmail);
  const [batchSending, setBatchSending] = useState(false);

  const selectedCount = selectedIds.length;
  const allVisibleSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id));

  const currentQuery = useCallback((nextSearch = search, nextStatus = status, nextJobId = jobId, nextSource = source) => {
    const params = new URLSearchParams();
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (nextStatus) params.set("status", nextStatus);
    if (nextJobId) params.set("job_id", nextJobId);
    if (nextSource !== "all") params.set("source", nextSource);
    return params.size ? `?${params}` : "";
  }, [jobId, search, source, status]);

  const load = useCallback((query = "") => {
    setLoading(true);
    api<{ applications: Application[] }>(`/admin/applications${query}`)
      .then((response) => {
        setItems(response.applications);
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
  }, [search, status, jobId, source, load, currentQuery]);

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
    setTargetGroupId(groups[0]?.id ?? "");
    setBatchEmail(defaultBatchEmail);
    setError("");
    setSuccess("");
  }

  async function submitBatch() {
    if (!batchMode || !selectedIds.length) return;
    if (batchMode === "create" && !groupName.trim()) { setError("Group name is required."); return; }
    if (batchMode === "existing" && !targetGroupId) { setError("Select an existing group."); return; }
    setBatchSending(true);
    setError("");
    setSuccess("");
    try {
      let groupId = targetGroupId;
      let recipientIds = selectedIds;
      if (batchMode === "create") {
        const created = await api<{ group: ApplicationGroup; added_application_ids?: string[] }>("/admin/application-groups", {
          method: "POST",
          body: { name: groupName.trim(), application_ids: selectedIds },
        });
        groupId = created.group.id;
        recipientIds = created.added_application_ids?.length ? created.added_application_ids : selectedIds;
      } else {
        const added = await api<{ group: ApplicationGroup; added: number; added_application_ids?: string[] }>(`/admin/application-groups/${groupId}/members`, { method: "POST", body: { application_ids: selectedIds } });
        recipientIds = added.added_application_ids ?? [];
      }
      if (!recipientIds.length) {
        setSuccess("Group already had the selected applicants. No new emails were sent.");
        setBatchMode(null);
        setSelectedIds([]);
        loadGroups();
        return;
      }
      const result = await api<{ sent: number; failed: number }>(`/admin/application-groups/${groupId}/send-email`, {
        method: "POST",
        body: { ...batchEmail, application_ids: recipientIds },
      });
      setSuccess(`Group saved. Emails sent to ${recipientIds.length} newly added applicant${recipientIds.length === 1 ? "" : "s"}. Sent: ${result.sent}. Failed: ${result.failed}.`);
      setBatchMode(null);
      setSelectedIds([]);
      loadGroups();
      load(currentQuery());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Batch email failed");
    } finally {
      setBatchSending(false);
    }
  }

  return (
    <>
      <PageIntro title="Applications" body="Filter applications, select applicants, create groups, and send batch emails from the queue." />
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
        <div className="admin-table-wrap">
          <table className="admin-table selectable-table">
            <thead><tr><th><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Select all visible applications" /></th><th>Candidate</th><th>Role</th><th>Status</th><th>Track</th><th>Score</th><th>Applied</th><th>Source</th><th>Decision</th><th><span className="sr-only">Open</span></th></tr></thead>
            <tbody>
              {items.map((application) => {
                const isFinal = ["Rejected", "Hired", "Withdrawn"].includes(application.internal_status || "");
                const selected = selectedIds.includes(application.id);
                return (
                  <tr key={application.id} className={selected ? "selected" : ""}>
                    <td><input type="checkbox" checked={selected} onChange={() => toggleRow(application.id)} aria-label={`Select ${application.candidate?.full_name || "applicant"}`} /></td>
                    <td><strong>{application.candidate?.full_name}</strong><small>{application.candidate?.email}</small></td>
                    <td><strong>{application.job.title}</strong><small>{application.job.public_code}</small></td>
                    <td><StatusBadge value={application.internal_status || application.candidate_status} /></td>
                    <td><strong>{application.candidate_analysis?.recommended_track || "-"}</strong><small>{[application.candidate_analysis?.graduation_year, application.candidate_analysis?.location_priority].filter(Boolean).join(" | ")}</small></td>
                    <td>{application.candidate_analysis?.suitability_score ?? "-"}</td>
                    <td>{formatDate(application.created_at)}</td>
                    <td><span className={`source-pill source-pill-${sourceKey(application.source)}`}>{sourceLabel(application.source)}</span></td>
                    <td><div className="table-actions"><button className="icon-button" title="Analyze applicant" aria-label="Analyze applicant" onClick={() => analyzeOne(application)} disabled={Boolean(actionId)}><BarChart3 size={17} /></button><button className="icon-button success" title="Approve applicant" aria-label="Approve applicant" onClick={() => decide(application, "Shortlisted")} disabled={isFinal || Boolean(actionId)}><CheckCircle2 size={17} /></button><button className="icon-button danger" title="Reject applicant" aria-label="Reject applicant" onClick={() => decide(application, "Rejected")} disabled={isFinal || Boolean(actionId)}><XCircle size={17} /></button></div></td>
                    <td><Link className="icon-button" href={`/admin/applications/${application.id}`}><ArrowRight size={17} /></Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title="No applications found" body="Sync the mailbox or adjust the filters to find submissions." />}

      {batchMode ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="batch-email-dialog">
            <div className="batch-email-head">
              <div><h2>{batchMode === "create" ? "Create group and send email" : "Add to group and send email"}</h2><p>{selectedCount} selected applicant{selectedCount === 1 ? "" : "s"}</p></div>
              <button className="icon-button" onClick={() => setBatchMode(null)} aria-label="Close"><X size={17} /></button>
            </div>
            <div className="batch-email-grid">
              <div className="batch-email-form">
                {batchMode === "create" ? (
                  <label><span>Group name</span><input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="e.g. Frontend shortlist July" autoFocus /></label>
                ) : (
                  <label><span>Existing group</span><select value={targetGroupId} onChange={(event) => setTargetGroupId(event.target.value)}>{groups.map((group) => <option value={group.id} key={group.id}>{group.name} ({group.member_count})</option>)}</select></label>
                )}
                <label><span>Email purpose</span><input value={batchEmail.purpose} onChange={(event) => setBatchEmail((current) => ({ ...current, purpose: event.target.value }))} /></label>
                <label><span>Status to apply</span><select value={batchEmail.status_to_apply} onChange={(event) => setBatchEmail((current) => ({ ...current, status_to_apply: event.target.value }))}><option value="">Do not change status</option>{STATUSES.map((value) => <option key={value}>{value}</option>)}</select></label>
                <label><span>Subject</span><input value={batchEmail.subject} onChange={(event) => setBatchEmail((current) => ({ ...current, subject: event.target.value }))} /></label>
                <label><span>Plain text body</span><textarea rows={7} value={batchEmail.text_body} onChange={(event) => setBatchEmail((current) => ({ ...current, text_body: event.target.value }))} /></label>
                <label><span>HTML body</span><textarea rows={8} value={batchEmail.html_body} onChange={(event) => setBatchEmail((current) => ({ ...current, html_body: event.target.value }))} /></label>
                <div className="template-variables"><strong>Variables</strong><code>{"{{candidate_name}}"}</code><code>{"{{job_title}}"}</code><code>{"{{application_status}}"}</code><code>{"{{application_url}}"}</code><code>{"{{group_name}}"}</code></div>
              </div>
              <aside className="batch-email-preview">
                <h3>Recipients</h3>
                {selectedApplications.slice(0, 8).map((application) => <div key={application.id}><strong>{application.candidate?.full_name}</strong><span>{application.candidate?.email}</span><small>{application.job.title}</small></div>)}
                {selectedApplications.length > 8 ? <p>+{selectedApplications.length - 8} more</p> : null}
              </aside>
            </div>
            <div className="batch-email-actions"><button className="button button-secondary" onClick={() => setBatchMode(null)}>Cancel</button><button className="button button-primary" onClick={submitBatch} disabled={batchSending}><Mail size={15} />{batchSending ? "Sending" : "Save group and send"}</button></div>
          </section>
        </div>
      ) : null}
    </>
  );
}
