"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Search, Users, Copy, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import type { Application } from "@/lib/types";
import { LoadingBlock, EmptyState, StatusBadge, Feedback } from "@/components/ui";
import { formatDate } from "@/lib/format";

interface SearchResult {
  results: Application[];
  total: number;
  page: number;
  pages: number;
}

interface DuplicateResult {
  duplicates: {
    candidate_id: string;
    candidate_name: string;
    candidate_email: string;
    application_count: number;
    applications: { id: string; job_title: string | null; status: string; created_at: string }[];
  }[];
  total: number;
}

export function AdminCandidateSearch() {
  const [tab, setTab] = useState<"search" | "duplicates">("search");
  const [query, setQuery] = useState("");
  const [skills, setSkills] = useState("");
  const [scoreMin, setScoreMin] = useState("");
  const [track, setTrack] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const search = useCallback(async (q: string, sk: string, sm: string, tr: string) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (sk) params.set("skills", sk);
      if (sm) params.set("score_min", sm);
      if (tr) params.set("track", tr);
      const data = await api<SearchResult>(`/admin/candidates/search?${params}`);
      setResults(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value, skills, scoreMin, track), 400);
  };

  const loadDuplicates = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<DuplicateResult>("/admin/candidates/duplicates");
      setDuplicates(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load duplicates");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button
          className={`button ${tab === "search" ? "button-primary" : "button-secondary"} button-small`}
          onClick={() => setTab("search")}
        >
          <Search size={14} /> Search
        </button>
        <button
          className={`button ${tab === "duplicates" ? "button-primary" : "button-secondary"} button-small`}
          onClick={() => { setTab("duplicates"); if (!duplicates) loadDuplicates(); }}
        >
          <Copy size={14} /> Duplicate Detection
        </button>
      </div>

      {tab === "search" && (
        <>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 120px 140px", marginBottom: 24 }}>
            <div>
              <label className="field-label">Search</label>
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--faint)" }} />
                <input
                  className="field"
                  placeholder="Name, email, role, or resume content…"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>
            <div>
              <label className="field-label">Skills (comma-separated)</label>
              <input
                className="field"
                placeholder="e.g. React, Python, SQL"
                value={skills}
                onChange={(e) => { setSkills(e.target.value); clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => search(query, e.target.value, scoreMin, track), 600); }}
              />
            </div>
            <div>
              <label className="field-label">Min AI score</label>
              <input
                className="field"
                type="number"
                min={0}
                max={100}
                placeholder="0–100"
                value={scoreMin}
                onChange={(e) => { setScoreMin(e.target.value); clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => search(query, skills, e.target.value, track), 600); }}
              />
            </div>
            <div>
              <label className="field-label">Track</label>
              <select
                className="field"
                value={track}
                onChange={(e) => { setTrack(e.target.value); search(query, skills, scoreMin, e.target.value); }}
              >
                <option value="">All tracks</option>
                <option value="Internship">Internship</option>
                <option value="Full-time">Full-time</option>
              </select>
            </div>
          </div>
          {error && <Feedback tone="error">{error}</Feedback>}
          {loading && <LoadingBlock label="Searching candidates" />}
          {results && !loading && (
            <>
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
                {results.total} result{results.total !== 1 ? "s" : ""}
              </div>
              {results.results.length === 0 ? (
                <EmptyState title="No results" body="Try a different search term or adjust filters." />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Role</th>
                        <th>AI Score</th>
                        <th>Track</th>
                        <th>Status</th>
                        <th>Applied</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.results.map((app) => {
                        const analysis = app.candidate_analysis;
                        return (
                          <tr key={app.id}>
                            <td>
                              <div style={{ fontWeight: 700 }}>{app.candidate?.full_name ?? "—"}</div>
                              <div style={{ fontSize: 12, color: "var(--muted)" }}>{app.candidate?.email}</div>
                            </td>
                            <td style={{ fontSize: 13 }}>{app.job?.title ?? "—"}</td>
                            <td>
                              {analysis?.suitability_score != null ? (
                                <span style={{ fontWeight: 700, color: analysis.suitability_score >= 70 ? "var(--success)" : analysis.suitability_score >= 50 ? "var(--warning)" : "var(--danger)" }}>
                                  {analysis.suitability_score}
                                </span>
                              ) : <span style={{ color: "var(--faint)" }}>—</span>}
                            </td>
                            <td style={{ fontSize: 13 }}>{analysis?.recommended_track ?? "—"}</td>
                            <td><StatusBadge value={app.candidate_status} /></td>
                            <td style={{ fontSize: 12, color: "var(--muted)" }}>{formatDate(app.created_at)}</td>
                            <td>
                              <Link className="button button-secondary button-small" href={`/admin/applications/${app.id}`}>
                                View
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
          {!results && !loading && (
            <EmptyState
              title="Search candidates"
              body="Enter a name, email, skill, or keyword to search across all candidate profiles and resumes."
              action={<Users size={40} style={{ color: "var(--faint)", margin: "0 auto" }} />}
            />
          )}
        </>
      )}

      {tab === "duplicates" && (
        <>
          {error && <Feedback tone="error">{error}</Feedback>}
          {loading && <LoadingBlock label="Detecting duplicates" />}
          {duplicates && !loading && (
            <>
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
                {duplicates.total} candidate{duplicates.total !== 1 ? "s" : ""} with multiple applications
              </div>
              {duplicates.duplicates.length === 0 ? (
                <EmptyState title="No duplicates found" body="All candidates have submitted a single application." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {duplicates.duplicates.map((dup) => (
                    <div key={dup.candidate_id} className="panel" style={{ padding: "20px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <AlertTriangle size={16} style={{ color: "var(--warning)" }} />
                        <strong>{dup.candidate_name}</strong>
                        <span style={{ fontSize: 13, color: "var(--muted)" }}>{dup.candidate_email}</span>
                        <span style={{ marginLeft: "auto", background: "var(--warning-soft)", color: "var(--warning)", padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                          {dup.application_count} applications
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {dup.applications.map((a) => (
                          <div key={a.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 14px", background: "var(--surface)", borderRadius: 6 }}>
                            <span style={{ flex: 1, fontSize: 14 }}>{a.job_title ?? "Unknown Role"}</span>
                            <StatusBadge value={a.status} />
                            <span style={{ fontSize: 12, color: "var(--muted)" }}>{formatDate(a.created_at)}</span>
                            <Link className="button button-ghost button-small" href={`/admin/applications/${a.id}`}>View</Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
