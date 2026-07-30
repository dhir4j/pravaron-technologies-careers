"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LoadingBlock, PageIntro, Feedback } from "@/components/ui";

type Analytics = {
  date_range: {
    start_date: string;
    end_date: string;
    days: number;
  };
  applications: {
    total: number;
    by_status: Record<string, number>;
    by_source: Record<string, number>;
    by_job: Array<{ job_id: string; job_title: string; count: number }>;
  };
  jobs: {
    total: number;
    published: number;
    draft: number;
    closed: number;
  };
  candidates: {
    total: number;
    verified: number;
    unverified: number;
  };
  conversion: {
    applied_to_shortlisted: number;
    shortlisted_to_interview: number;
    interview_to_offer: number;
    offer_to_hired: number;
  };
  timeline: Array<{
    date: string;
    applications: number;
    shortlisted: number;
    interviews: number;
    offers: number;
  }>;
};

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadAnalytics(days);
  }, [days]);

  async function loadAnalytics(dayRange: number) {
    setLoading(true);
    setError("");
    try {
      const response = await api<{ analytics: Analytics }>(`/admin/analytics?days=${dayRange}`);
      setAnalytics(response.analytics);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingBlock label="Loading analytics" />;
  if (error) return <Feedback tone="error">{error}</Feedback>;
  if (!analytics) return <Feedback tone="error">No analytics data available</Feedback>;

  return (
    <div className="analytics-page">
      <PageIntro
        title="Recruitment Analytics"
        body={`Showing data for the last ${analytics.date_range.days} days`}
      />

      <div className="analytics-filters">
        <label>
          <span>Time Range:</span>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </label>
      </div>

      {/* Summary Cards */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Total Applications</h3>
          <div className="metric">{analytics.applications.total}</div>
          <div className="metric-label">Applications received</div>
        </div>

        <div className="analytics-card">
          <h3>Active Jobs</h3>
          <div className="metric">{analytics.jobs.published}</div>
          <div className="metric-label">Published positions</div>
        </div>

        <div className="analytics-card">
          <h3>Total Candidates</h3>
          <div className="metric">{analytics.candidates.total}</div>
          <div className="metric-label">{analytics.candidates.verified} verified</div>
        </div>

        <div className="analytics-card">
          <h3>Conversion Rate</h3>
          <div className="metric">{analytics.conversion.applied_to_shortlisted.toFixed(1)}%</div>
          <div className="metric-label">Applied to shortlisted</div>
        </div>
      </div>

      {/* Applications by Status */}
      <div className="analytics-section">
        <h2>Applications by Status</h2>
        <div className="status-breakdown">
          {Object.entries(analytics.applications.by_status).map(([status, count]) => (
            <div key={status} className="status-item">
              <div className="status-label">{status}</div>
              <div className="status-count">{count}</div>
              <div className="status-bar">
                <div
                  className="status-bar-fill"
                  style={{
                    width: `${(count / analytics.applications.total) * 100}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Applications by Source */}
      <div className="analytics-section">
        <h2>Applications by Source</h2>
        <div className="source-breakdown">
          {Object.entries(analytics.applications.by_source).map(([source, count]) => (
            <div key={source} className="source-item">
              <div className="source-label">{source || "Direct"}</div>
              <div className="source-count">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Jobs */}
      <div className="analytics-section">
        <h2>Applications by Job</h2>
        <div className="jobs-table">
          <table>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Applications</th>
              </tr>
            </thead>
            <tbody>
              {analytics.applications.by_job.map((job) => (
                <tr key={job.job_id}>
                  <td>{job.job_title}</td>
                  <td>{job.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="analytics-section">
        <h2>Conversion Funnel</h2>
        <div className="funnel">
          <div className="funnel-stage">
            <div className="funnel-label">Applied</div>
            <div className="funnel-value">{analytics.applications.total}</div>
          </div>
          <div className="funnel-arrow">↓ {analytics.conversion.applied_to_shortlisted.toFixed(1)}%</div>
          <div className="funnel-stage">
            <div className="funnel-label">Shortlisted</div>
            <div className="funnel-value">{analytics.applications.by_status["Shortlisted"] || 0}</div>
          </div>
          <div className="funnel-arrow">↓ {analytics.conversion.shortlisted_to_interview.toFixed(1)}%</div>
          <div className="funnel-stage">
            <div className="funnel-label">Interview</div>
            <div className="funnel-value">{analytics.applications.by_status["Interview"] || 0}</div>
          </div>
          <div className="funnel-arrow">↓ {analytics.conversion.interview_to_offer.toFixed(1)}%</div>
          <div className="funnel-stage">
            <div className="funnel-label">Offer</div>
            <div className="funnel-value">{analytics.applications.by_status["Offer Sent"] || 0}</div>
          </div>
          <div className="funnel-arrow">↓ {analytics.conversion.offer_to_hired.toFixed(1)}%</div>
          <div className="funnel-stage">
            <div className="funnel-label">Hired</div>
            <div className="funnel-value">{analytics.applications.by_status["Hired"] || 0}</div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {analytics.timeline.length > 0 && (
        <div className="analytics-section">
          <h2>Daily Trends</h2>
          <div className="timeline-chart">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Applications</th>
                  <th>Shortlisted</th>
                  <th>Interviews</th>
                  <th>Offers</th>
                </tr>
              </thead>
              <tbody>
                {analytics.timeline.map((day) => (
                  <tr key={day.date}>
                    <td>{new Date(day.date).toLocaleDateString()}</td>
                    <td>{day.applications}</td>
                    <td>{day.shortlisted}</td>
                    <td>{day.interviews}</td>
                    <td>{day.offers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
