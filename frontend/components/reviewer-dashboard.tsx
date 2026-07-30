"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ClipboardCheck, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import type { Application } from "@/lib/types";
import { LoadingBlock, EmptyState, PageIntro, StatusBadge, Feedback } from "@/components/ui";
import { formatDate } from "@/lib/format";

export function ReviewerDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ applications: Application[] }>("/admin/reviewer/applications");
      setApplications(data.applications);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageIntro
        eyebrow="Reviewer Portal"
        title="My Assigned Applications"
        body="Applications assigned to you for review. You can view details, add scorecards, and add notes."
      />

      <div className="reviewer-banner">
        <ClipboardCheck size={18} />
        You are in reviewer mode. Only applications assigned to you are shown.
      </div>

      {loading && <LoadingBlock label="Loading assigned applications" />}
      {error && <Feedback tone="error">{error}</Feedback>}

      {!loading && !error && applications.length === 0 && (
        <EmptyState
          title="No applications assigned"
          body="You haven't been assigned any applications yet. Check back after a hiring admin assigns reviews to you."
        />
      )}

      {!loading && applications.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Role</th>
                <th>Status</th>
                <th>Applied</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{app.candidate?.full_name ?? "—"}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>{app.candidate?.email}</div>
                  </td>
                  <td>{app.job?.title ?? "—"}</td>
                  <td><StatusBadge value={app.candidate_status} /></td>
                  <td style={{ fontSize: 13, color: "var(--muted)" }}>{formatDate(app.created_at)}</td>
                  <td>
                    <Link className="button button-secondary button-small" href={`/admin/applications/${app.id}`}>
                      <ExternalLink size={14} />
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
