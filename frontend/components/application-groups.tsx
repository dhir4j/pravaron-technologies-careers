"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FolderOpen, Mail, Search, Trash2, UsersRound } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { ApplicationGroup } from "@/lib/types";
import { EmptyState, Feedback, LoadingBlock, PageIntro, StatusBadge } from "@/components/ui";

export function ApplicationGroups() {
  const [groups, setGroups] = useState<ApplicationGroup[]>([]);
  const [selected, setSelected] = useState<ApplicationGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async (preferredId?: string) => {
    setLoading(true);
    try {
      const data = await api<{ groups: ApplicationGroup[] }>("/admin/application-groups");
      setGroups(data.groups);
      const detailId = preferredId ?? data.groups[0]?.id;
      if (detailId) {
        const detail = await api<{ group: ApplicationGroup }>(`/admin/application-groups/${detailId}`);
        setSelected(detail.group);
      } else {
        setSelected(null);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return groups;
    return groups.filter((group) => [group.name, group.description, group.status].filter(Boolean).join(" ").toLowerCase().includes(needle));
  }, [groups, query]);

  const totalMembers = useMemo(() => groups.reduce((sum, group) => sum + (group.member_count || 0), 0), [groups]);
  const sentEmails = selected?.emails?.filter((email) => email.delivery_status === "sent").length ?? 0;
  const failedEmails = selected?.emails?.filter((email) => email.delivery_status === "failed").length ?? 0;
  const latestEmail = selected?.emails?.[0];

  async function openGroup(id: string) {
    setError("");
    try {
      const detail = await api<{ group: ApplicationGroup }>(`/admin/application-groups/${id}`);
      setSelected(detail.group);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load group");
    }
  }

  async function removeMember(memberId: string) {
    if (!selected) return;
    if (!window.confirm("Remove this applicant from the group?")) return;
    setError("");
    setSuccess("");
    try {
      await api(`/admin/application-groups/${selected.id}/members/${memberId}`, { method: "DELETE" });
      const detail = await api<{ group: ApplicationGroup }>(`/admin/application-groups/${selected.id}`);
      setSelected(detail.group);
      setGroups((current) => current.map((group) => group.id === detail.group.id ? { ...group, member_count: detail.group.member_count } : group));
      setSuccess("Applicant removed from group.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to remove applicant");
    }
  }

  if (loading) return <LoadingBlock label="Loading application groups" />;

  return (
    <>
      <PageIntro title="Application groups" body="Manage saved applicant batches, inspect members, and track every group email from one place." />
      {error ? <Feedback tone="error">{error}</Feedback> : null}
      {success ? <Feedback tone="success">{success}</Feedback> : null}
      {groups.length === 0 ? (
        <EmptyState title="No groups yet" body="Select applicants from the Applications page and create your first group." />
      ) : (
        <div className="groups-workspace">
          <section className="group-summary-strip" aria-label="Group summary">
            <div>
              <span><FolderOpen size={16} /> Groups</span>
              <strong>{groups.length}</strong>
            </div>
            <div>
              <span><UsersRound size={16} /> Applicants</span>
              <strong>{totalMembers}</strong>
            </div>
            <div>
              <span><Mail size={16} /> Selected emails</span>
              <strong>{selected?.emails?.length ?? 0}</strong>
            </div>
          </section>

          <div className="groups-layout">
            <aside className="groups-sidebar" aria-label="Application groups">
              <div className="groups-sidebar-head">
                <div>
                  <h2>Groups</h2>
                  <p>{filteredGroups.length} of {groups.length} visible</p>
                </div>
                <Link className="button button-secondary button-small" href="/admin/applications">Add</Link>
              </div>
              <label className="group-search" aria-label="Search groups">
                <Search size={16} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search groups" />
              </label>
              <nav className="groups-list">
                {filteredGroups.map((group) => (
                  <button key={group.id} className={selected?.id === group.id ? "active" : ""} onClick={() => openGroup(group.id)}>
                    <span className="group-list-title">
                      <strong>{group.name}</strong>
                      <small>{group.member_count} applicants</small>
                    </span>
                    <span className="group-list-meta">
                      <StatusBadge value={group.status} />
                      <small>{formatDate(group.created_at)}</small>
                    </span>
                  </button>
                ))}
              </nav>
              {filteredGroups.length === 0 ? <p className="group-list-empty">No group matches this search.</p> : null}
            </aside>

            {selected ? (
              <section className="group-detail-panel" aria-label="Selected group details">
                <div className="group-detail-hero">
                  <div>
                    <span className="group-kicker">Batch group</span>
                    <h2>{selected.name}</h2>
                    <p>{selected.description || "Saved applicant group for batch communication and status updates."}</p>
                  </div>
                  <div className="group-detail-actions">
                    <StatusBadge value={selected.status} />
                    <Link className="button button-secondary button-small" href="/admin/applications">Add applicants</Link>
                  </div>
                </div>

                <div className="group-metrics">
                  <div><UsersRound size={17} /><span>Members</span><strong>{selected.member_count}</strong></div>
                  <div><CheckCircle2 size={17} /><span>Sent</span><strong>{sentEmails}</strong></div>
                  <div><Mail size={17} /><span>Failed</span><strong>{failedEmails}</strong></div>
                  <div><Clock3 size={17} /><span>Latest</span><strong>{latestEmail ? formatDate(latestEmail.created_at) : "None"}</strong></div>
                </div>

                <div className="group-section-heading">
                  <div>
                    <h3>Members</h3>
                    <p>Open a candidate record or remove them from this group.</p>
                  </div>
                  <span>{selected.members?.length ?? 0} selected</span>
                </div>
                {selected.members?.length ? (
                  <div className="group-member-list">
                    {selected.members.map((member) => (
                      <article key={member.id} className="group-member-row">
                        <div className="member-avatar" aria-hidden="true">{(member.candidate_name || member.candidate_email || "A").slice(0, 1).toUpperCase()}</div>
                        <div className="member-main">
                          <strong>{member.candidate_name || "Unnamed applicant"}</strong>
                          <span>{member.candidate_email}</span>
                        </div>
                        <div className="member-job">
                          <span>Applied for</span>
                          <strong>{member.job_title || "Unknown role"}</strong>
                        </div>
                        <StatusBadge value={member.application_status || "Application"} />
                        <small className="member-date">{formatDate(member.created_at)}</small>
                        <div className="table-actions">
                          <Link className="icon-button" href={`/admin/applications/${member.application_id}`} aria-label="Open application"><ArrowRight size={15} /></Link>
                          <button className="icon-button danger" onClick={() => removeMember(member.id)} aria-label="Remove applicant"><Trash2 size={15} /></button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : <EmptyState title="No members" body="Add applicants from the Applications page." />}

                <div className="group-section-heading">
                  <div>
                    <h3>Email history</h3>
                    <p>Every batch message sent to this group is stored here.</p>
                  </div>
                </div>
                {selected.emails?.length ? (
                  <div className="group-email-history">
                    {selected.emails.map((email) => (
                      <article key={email.id}>
                        <div>
                          <strong>{email.subject}</strong>
                          <span>{email.to_email}</span>
                        </div>
                        <span className="email-purpose">{email.purpose || email.status_to_apply || "Batch email"}</span>
                        <StatusBadge value={email.delivery_status} />
                        <small>{email.sent_at ? formatDate(email.sent_at, true) : formatDate(email.created_at, true)}</small>
                      </article>
                    ))}
                  </div>
                ) : <p className="muted-copy">No batch emails sent for this group yet.</p>}
              </section>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
