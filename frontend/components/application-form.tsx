"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileUp, LockKeyhole } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { formatFileSize } from "@/lib/format";
import type { Job, Profile, Resume } from "@/lib/types";
import { Feedback, LoadingBlock } from "@/components/ui";

export function ApplicationForm({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(`/apply/${jobId}`)}`);
      return;
    }
    if (user.role !== "candidate") {
      setError("Hiring team accounts cannot submit candidate applications.");
      setLoading(false);
      return;
    }

    Promise.all([
      api<{ jobs: Job[] }>("/public/jobs"),
      api<{ profile: Profile }>("/candidate/profile"),
      api<{ resumes: Resume[] }>("/candidate/resumes"),
    ])
      .then(([jobsResponse, profileResponse, resumesResponse]) => {
        setJob(jobsResponse.jobs.find((item) => item.id === jobId) || null);
        setProfile(profileResponse.profile);
        setResumes(resumesResponse.resumes);
        setSelectedResume(resumesResponse.resumes[0]?.id || "");
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [authLoading, jobId, router, user]);

  async function uploadResume(file: File) {
    setError("");
    const body = new FormData();
    body.append("resume", file);
    try {
      const response = await api<{ resume: Resume }>("/candidate/resumes", {
        method: "POST",
        body,
      });
      setResumes((items) => [response.resume, ...items]);
      setSelectedResume(response.resume.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Resume upload failed");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!job) return;
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const answers: Record<string, string | string[]> = {};
    job.application_questions.forEach((question, index) => {
      const key = question.id || `question_${index + 1}`;
      answers[key] = String(form.get(key) || "");
    });

    try {
      const response = await api<{ application: { id: string } }>("/candidate/applications", {
        method: "POST",
        body: {
          job_id: job.id,
          resume_id: selectedResume,
          cover_message: form.get("cover_message"),
          answers,
          source: "careers_website",
          declarations: {
            accuracy: form.get("accuracy") === "on",
            privacy: form.get("privacy") === "on",
            future_opportunities: form.get("future_opportunities") === "on",
          },
        },
      });
      setSuccess("Application submitted. Your dashboard has the latest status.");
      window.setTimeout(() => router.push(`/candidate/applications/${response.application.id}`), 900);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loading) return <main className="public-page"><LoadingBlock label="Preparing application" /></main>;
  if (!user) return null;
  if (!job) {
    return (
      <main className="public-page section-shell">
        <Feedback tone="error">{error || "This job is not available."}</Feedback>
      </main>
    );
  }

  return (
    <main className="application-page">
      <header className="application-header">
        <div>
          <p className="eyebrow">Application</p>
          <h1>{job.title}</h1>
          <p>{job.public_code} | {job.location || "Location flexible"} | {job.workplace_model}</p>
        </div>
        <div className="secure-note">
          <LockKeyhole size={18} />
          <span>Your application data is private and used for recruitment.</span>
        </div>
      </header>
      <form className="application-layout" onSubmit={submit}>
        <div className="application-main">
          {error ? <Feedback tone="error">{error}</Feedback> : null}
          {success ? <Feedback tone="success">{success}</Feedback> : null}
          {!user.is_verified ? (
            <Feedback tone="error">
              Verify your email before submitting. Use the verification flow from registration or contact support.
            </Feedback>
          ) : null}

          <section className="form-section">
            <div className="form-section-heading">
              <span>Profile</span>
              <h2>Contact and professional context</h2>
            </div>
            <div className="form-grid">
              <label>
                <span>Full name</span>
                <input value={user.full_name} disabled />
              </label>
              <label>
                <span>Email address</span>
                <input value={user.email} disabled />
              </label>
              <label>
                <span>Phone number</span>
                <input value={profile.phone || ""} disabled />
              </label>
              <label>
                <span>Current role</span>
                <input value={profile.current_role || ""} disabled />
              </label>
            </div>
            <Link className="text-link" href="/candidate/profile">Update profile</Link>
          </section>

          <section className="form-section">
            <div className="form-section-heading">
              <span>Resume</span>
              <h2>Select the version used for this application</h2>
            </div>
            {resumes.length ? (
              <div className="resume-options">
                {resumes.map((resume) => (
                  <label className="resume-option" key={resume.id}>
                    <input
                      type="radio"
                      name="resume_id"
                      value={resume.id}
                      checked={selectedResume === resume.id}
                      onChange={() => setSelectedResume(resume.id)}
                    />
                    <FileUp size={20} />
                    <span>
                      <strong>{resume.original_filename}</strong>
                      <small>Version {resume.version} | {formatFileSize(resume.size_bytes)}</small>
                    </span>
                    {selectedResume === resume.id ? <CheckCircle2 size={20} /> : null}
                  </label>
                ))}
              </div>
            ) : (
              <p className="form-helper">Upload a PDF, DOC, or DOCX resume to continue.</p>
            )}
            <label className="upload-control">
              <FileUp size={20} />
              <span>{resumes.length ? "Upload another resume" : "Upload resume"}</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadResume(file);
                }}
              />
            </label>
          </section>

          <section className="form-section">
            <div className="form-section-heading">
              <span>Your application</span>
              <h2>Share relevant context</h2>
            </div>
            <label>
              <span>Message to the hiring team</span>
              <textarea
                name="cover_message"
                rows={6}
                placeholder="Tell us why this role and your experience are a strong match."
              />
            </label>
            {job.application_questions.map((question, index) => {
              const key = question.id || `question_${index + 1}`;
              return (
                <label key={key}>
                  <span>{question.label || question.question || `Question ${index + 1}`}</span>
                  {question.type === "long_text" ? (
                    <textarea name={key} rows={4} required={question.required} />
                  ) : question.type === "single_select" && question.options ? (
                    <select name={key} required={question.required}>
                      <option value="">Select an option</option>
                      {question.options.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input name={key} required={question.required} />
                  )}
                </label>
              );
            })}
          </section>

          <section className="form-section declarations">
            <h2>Declaration and privacy</h2>
            <label className="check-field">
              <input type="checkbox" name="accuracy" required />
              <span>I confirm that the information provided is accurate to the best of my knowledge.</span>
            </label>
            <label className="check-field">
              <input type="checkbox" name="privacy" required />
              <span>I understand that Pravaron Technologies will use this information for recruitment.</span>
            </label>
            <label className="check-field">
              <input type="checkbox" name="future_opportunities" />
              <span>Keep my profile for suitable future opportunities.</span>
            </label>
          </section>
        </div>

        <aside className="application-summary">
          <span>Review</span>
          <h2>{job.title}</h2>
          <dl>
            <div><dt>Profile</dt><dd>{profile.phone && profile.current_role ? "Ready" : "Check details"}</dd></div>
            <div><dt>Resume</dt><dd>{selectedResume ? "Selected" : "Required"}</dd></div>
            <div><dt>Email</dt><dd>{user.is_verified ? "Verified" : "Not verified"}</dd></div>
          </dl>
          <button
            className="button button-primary button-wide"
            disabled={submitting || !selectedResume || !user.is_verified}
          >
            {submitting ? "Submitting" : "Submit application"}
          </button>
          <small>By submitting, you accept the declarations shown in this form.</small>
        </aside>
      </form>
    </main>
  );
}
