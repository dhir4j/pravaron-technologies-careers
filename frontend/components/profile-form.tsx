"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Profile, User } from "@/lib/types";
import { Feedback, LoadingBlock, PageIntro } from "@/components/ui";

const fields: Array<{ name: keyof Profile; label: string; type?: string; placeholder?: string }> = [
  { name: "phone", label: "Phone number", type: "tel" },
  { name: "current_city", label: "Current city" },
  { name: "state", label: "State" },
  { name: "country", label: "Country" },
  { name: "preferred_work_location", label: "Preferred work location" },
  { name: "current_role", label: "Current role" },
  { name: "total_experience_years", label: "Total experience in years", type: "number" },
  { name: "current_company", label: "Current company" },
  { name: "notice_period", label: "Notice period" },
  { name: "current_compensation", label: "Current compensation", type: "text" },
  { name: "expected_compensation", label: "Expected compensation", type: "text" },
  { name: "linkedin_url", label: "LinkedIn URL", type: "url" },
  { name: "github_url", label: "GitHub URL", type: "url" },
  { name: "portfolio_url", label: "Portfolio URL", type: "url" },
  { name: "personal_website_url", label: "Personal website", type: "url" },
];

export function ProfileForm() {
  const [profile, setProfile] = useState<Profile>({});
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api<{ profile: Profile; user: User }>("/candidate/profile")
      .then((response) => {
        setProfile(response.profile);
        setUser(response.user);
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = {};
    fields.forEach(({ name, type }) => {
      const value = String(form.get(name) || "").trim();
      body[name] = type === "number" && value ? Number(value) : value || null;
    });
    body.skills = String(form.get("skills") || "")
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
    try {
      const response = await api<{ profile: Profile }>("/candidate/profile", {
        method: "PATCH",
        body,
      });
      setProfile(response.profile);
      setSuccess("Profile updated.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock label="Loading profile" />;

  return (
    <>
      <PageIntro title="Candidate profile" body="Keep your contact, work, and portfolio details ready for applications." />
      {error ? <Feedback tone="error">{error}</Feedback> : null}
      {success ? <Feedback tone="success">{success}</Feedback> : null}
      <form className="panel profile-form" onSubmit={submit}>
        <section>
          <h2>Account</h2>
          <div className="form-grid">
            <label><span>Full name</span><input value={user?.full_name || ""} disabled /></label>
            <label><span>Email address</span><input value={user?.email || ""} disabled /></label>
          </div>
        </section>
        <section>
          <h2>Personal and work details</h2>
          <div className="form-grid">
            {fields.slice(0, 11).map((field) => (
              <label key={field.name}>
                <span>{field.label}</span>
                <input
                  name={field.name}
                  type={field.type || "text"}
                  defaultValue={String(profile[field.name] ?? "")}
                  min={field.type === "number" ? 0 : undefined}
                  step={field.type === "number" ? 0.5 : undefined}
                />
              </label>
            ))}
          </div>
          <label>
            <span>Skills</span>
            <input name="skills" defaultValue={profile.skills?.join(", ") || ""} placeholder="Python, Next.js, APIs" />
            <small>Separate skills with commas.</small>
          </label>
        </section>
        <section>
          <h2>Professional links</h2>
          <div className="form-grid">
            {fields.slice(11).map((field) => (
              <label key={field.name}>
                <span>{field.label}</span>
                <input name={field.name} type={field.type} defaultValue={String(profile[field.name] ?? "")} />
              </label>
            ))}
          </div>
        </section>
        <div className="form-actions">
          <button className="button button-primary" disabled={saving}>{saving ? "Saving" : "Save profile"}</button>
        </div>
      </form>
    </>
  );
}
