"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CAREERS_CONTACT_EMAIL } from "@/lib/contact";
import { useAuth } from "@/contexts/auth-context";
import { PageIntro, Feedback, LoadingBlock } from "@/components/ui";

interface NotifPrefs {
  email_on_status_change: boolean;
  email_on_interview: boolean;
  email_on_offer: boolean;
  email_digest: boolean;
}

export default function CandidateSettingsPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotifPrefs>({
    email_on_status_change: true,
    email_on_interview: true,
    email_on_offer: true,
    email_digest: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const meta = (user?.profile as { metadata?: Record<string, boolean> } | undefined)?.metadata;
    if (meta) {
      setPrefs({
        email_on_status_change: meta.email_on_status_change !== false,
        email_on_interview: meta.email_on_interview !== false,
        email_on_offer: meta.email_on_offer !== false,
        email_digest: meta.email_digest === true,
      });
    }
    setLoading(false);
  }, [user]);

  const toggle = (key: keyof NotifPrefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await api("/candidate/profile/notification-preferences", { method: "PATCH", body: prefs });
      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingBlock />;

  return (
    <>
      <PageIntro title="Settings" body="Manage your account preferences and notification settings." />

      <section className="panel" style={{ maxWidth: 560, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Email notifications</h2>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>
          Choose which emails you&apos;d like to receive from Pravaron Technologies Careers.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {([
            ["email_on_status_change", "Application status updates", "Receive an email whenever your application status changes."],
            ["email_on_interview", "Interview invitations", "Receive emails when an interview is scheduled or updated."],
            ["email_on_offer", "Offer notifications", "Receive an email when an offer letter is issued."],
            ["email_digest", "Weekly digest", "Receive a weekly summary of your application activity."],
          ] as [keyof NotifPrefs, string, string][]).map(([key, label, desc]) => (
            <label key={key} style={{ display: "flex", gap: 14, cursor: "pointer", padding: "14px 16px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--line)" }}>
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={() => toggle(key)}
                style={{ width: 18, height: 18, accentColor: "var(--accent)", flexShrink: 0, marginTop: 2 }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>{desc}</div>
              </div>
            </label>
          ))}
        </div>
        <div style={{ marginTop: 24, display: "flex", gap: 10, alignItems: "center" }}>
          <button className="button button-primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save preferences"}
          </button>
          {saved && <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 700 }}>Saved!</span>}
        </div>
        {error && <Feedback tone="error">{error}</Feedback>}
      </section>

      <section className="panel" style={{ maxWidth: 560 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Account support</h2>
        <p style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 20 }}>
          Password recovery and account access are handled through the secure sign-in flow.
        </p>
        <a className="button button-secondary" href={`mailto:${CAREERS_CONTACT_EMAIL}`}>
          Contact careers support
        </a>
      </section>
    </>
  );
}
