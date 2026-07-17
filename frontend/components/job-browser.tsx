"use client";

import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Job } from "@/lib/types";
import { EmptyState, Feedback, LoadingBlock, StatusBadge } from "@/components/ui";

export function JobBrowser({ compact = false }: { compact?: boolean }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [type, setType] = useState("all");
  const [workplace, setWorkplace] = useState("all");

  useEffect(() => {
    api<{ jobs: Job[] }>("/public/jobs")
      .then((response) => setJobs(response.jobs))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const departments = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.department).filter(Boolean))) as string[],
    [jobs],
  );
  const types = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.employment_type).filter(Boolean))),
    [jobs],
  );

  const filtered = useMemo(() => {
    const needle = search.toLowerCase().trim();
    return jobs.filter((job) => {
      const matchesSearch =
        !needle ||
        [job.title, job.role_summary, job.department, ...job.required_skills]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));
      return (
        matchesSearch &&
        (department === "all" || job.department === department) &&
        (type === "all" || job.employment_type === type) &&
        (workplace === "all" || job.workplace_model === workplace)
      );
    });
  }, [department, jobs, search, type, workplace]);

  if (loading) return <LoadingBlock label="Loading open roles" />;
  if (error) return <Feedback tone="error">{error}</Feedback>;

  return (
    <div className="job-browser">
      {!compact ? (
        <div className="filter-bar">
          <label className="search-field">
            <span className="sr-only">Search roles</span>
            <Search size={18} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by role, skill, or team"
            />
          </label>
          <label>
            <span className="sr-only">Department</span>
            <select value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option value="all">All teams</option>
              {departments.map((value) => (
                <option value={value} key={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Employment type</span>
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option value="all">All role types</option>
              {types.map((value) => (
                <option value={value} key={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Workplace model</span>
            <select value={workplace} onChange={(event) => setWorkplace(event.target.value)}>
              <option value="all">Any workplace</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
            </select>
          </label>
        </div>
      ) : null}

      {filtered.length ? (
        <div className="job-list">
          {filtered.slice(0, compact ? 4 : undefined).map((job) => (
            <article className="job-row" key={job.id}>
              <div className="job-row-icon">
                <BriefcaseBusiness size={21} aria-hidden="true" />
              </div>
              <div className="job-row-main">
                <div>
                  <StatusBadge value={job.employment_type} />
                  <h3>{job.title}</h3>
                  <p>{job.role_summary}</p>
                </div>
                <div className="job-meta">
                  <span>Job ID {job.public_code}</span>
                  <span>
                    <MapPin size={15} aria-hidden="true" />
                    {job.location || "Location flexible"}
                  </span>
                  <span>{job.workplace_model}</span>
                  <span>{job.department || "Engineering"}</span>
                </div>
              </div>
              <Link
                className="icon-button job-row-link"
                href={`/jobs/${job.public_code}/${job.slug}`}
                aria-label={`View ${job.title}`}
              >
                <ArrowUpRight size={20} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No roles match these filters"
          body="Try a broader search or clear one of the filters."
          action={
            <button
              className="button button-secondary"
              onClick={() => {
                setSearch("");
                setDepartment("all");
                setType("all");
                setWorkplace("all");
              }}
            >
              Clear filters
            </button>
          }
        />
      )}
    </div>
  );
}
