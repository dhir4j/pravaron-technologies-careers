"use client";

import Link from "next/link";
import { Copy, Edit3, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Job } from "@/lib/types";
import { EmptyState, Feedback, LoadingBlock, PageIntro, StatusBadge } from "@/components/ui";

export function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    api<{ jobs: Job[] }>("/admin/jobs")
      .then((response) => setJobs(response.jobs))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function duplicate(id: string) {
    setError("");
    try {
      await api(`/admin/jobs/${id}/duplicate`, { method: "POST" });
      load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Duplicate failed");
    }
  }

  if (loading) return <LoadingBlock label="Loading jobs" />;

  return (
    <>
      <PageIntro
        title="Job management"
        body="Create, publish, pause, close, and reuse role definitions."
        action={<Link className="button button-primary" href="/admin/jobs/new"><Plus size={18} /> Create job</Link>}
      />
      {error ? <Feedback tone="error">{error}</Feedback> : null}
      {jobs.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Role</th><th>Status</th><th>Team</th><th>Updated</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td><strong>{job.title}</strong><small>{job.public_code} | {job.location}</small></td>
                  <td><StatusBadge value={job.status} /></td>
                  <td>{job.department || "Not assigned"}</td>
                  <td>{formatDate(job.updated_at)}</td>
                  <td className="table-actions">
                    <button className="icon-button" onClick={() => void duplicate(job.id)} title="Duplicate job"><Copy size={17} /></button>
                    <Link className="icon-button" href={`/admin/jobs/${job.id}`} title="Edit job"><Edit3 size={17} /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title="No jobs created" body="Create a draft to begin the hiring workflow." />}
    </>
  );
}
