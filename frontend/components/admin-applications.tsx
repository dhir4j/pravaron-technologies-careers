"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Application } from "@/lib/types";
import { EmptyState, Feedback, LoadingBlock, PageIntro, StatusBadge } from "@/components/ui";

export function AdminApplications() {
  const [items, setItems] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load(query = "") {
    setLoading(true);
    api<{ applications: Application[] }>(`/admin/applications${query}`)
      .then((response) => setItems(response.applications))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);

  function applyFilters() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    load(params.size ? `?${params}` : "");
  }

  return (
    <>
      <PageIntro title="Applications" body="Search candidates and move each application through the recruitment workflow." />
      {error ? <Feedback tone="error">{error}</Feedback> : null}
      <div className="admin-filter-bar">
        <label className="search-field"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Candidate, email, job, or application ID" /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {["New", "Assigned for Review", "Under Review", "Shortlisted", "Interview Scheduled", "Offer Sent", "Hired", "Rejected", "Withdrawn"].map((value) => <option key={value}>{value}</option>)}
        </select>
        <button className="button button-secondary" onClick={applyFilters}>Apply filters</button>
      </div>
      {loading ? <LoadingBlock label="Loading applications" /> : items.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Candidate</th><th>Role</th><th>Status</th><th>Applied</th><th>Source</th><th><span className="sr-only">Open</span></th></tr></thead>
            <tbody>
              {items.map((application) => (
                <tr key={application.id}>
                  <td><strong>{application.candidate?.full_name}</strong><small>{application.candidate?.email}</small></td>
                  <td><strong>{application.job.title}</strong><small>{application.job.public_code}</small></td>
                  <td><StatusBadge value={application.internal_status || application.candidate_status} /></td>
                  <td>{formatDate(application.created_at)}</td>
                  <td>{application.source || "Direct"}</td>
                  <td><Link className="icon-button" href={`/admin/applications/${application.id}`}><ArrowRight size={17} /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title="No applications found" body="Adjust the filters or wait for new submissions." />}
    </>
  );
}
