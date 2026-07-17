"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Job, JobContentSection } from "@/lib/types";
import { Feedback, LoadingBlock, PageIntro } from "@/components/ui";

function sectionsForJob(job?: Job | null): JobContentSection[] {
  if (job?.content_sections?.length) return job.content_sections;
  return [
    { id: "responsibilities", title: "What you will do", content: job?.responsibilities || "" },
    { id: "requirements", title: "What you should bring", content: job?.required_skills.join("\n") || "" },
    { id: "preferred", title: "Useful additional experience", content: job?.preferred_skills.join("\n") || "" },
    { id: "education", title: "Education", content: job?.education_preference || "" },
    { id: "experience", title: "Experience", content: job?.experience_requirement || "" },
  ];
}

function listFromSection(section?: JobContentSection) {
  return (section?.content || "").split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
}

export function JobEditor({ id }: { id?: string }) {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [contentSections, setContentSections] = useState<JobContentSection[]>(() => sectionsForJob());

  useEffect(() => {
    if (!id) return;
    api<{ jobs: Job[] }>("/admin/jobs")
      .then((response) => {
        const loadedJob = response.jobs.find((item) => item.id === id) || null;
        setJob(loadedJob);
        setContentSections(sectionsForJob(loadedJob));
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const sectionById = (sectionId: string) => contentSections.find((section) => section.id === sectionId);
    const body = {
      title: form.get("title"),
      public_code: form.get("public_code"),
      department: form.get("department"),
      employment_type: form.get("employment_type"),
      experience_level: form.get("experience_level"),
      openings: Number(form.get("openings") || 1),
      location: form.get("location"),
      workplace_model: form.get("workplace_model"),
      role_summary: form.get("role_summary"),
      responsibilities: sectionById("responsibilities")?.content || "",
      required_skills: listFromSection(sectionById("requirements")),
      preferred_skills: listFromSection(sectionById("preferred")),
      experience_requirement: sectionById("experience")?.content || "",
      education_preference: sectionById("education")?.content || "",
      content_sections: contentSections,
      application_status_text: form.get("application_status_text"),
      application_deadline: form.get("application_deadline") || null,
      status: form.get("status"),
    };
    try {
      await api(id ? `/admin/jobs/${id}` : "/admin/jobs", {
        method: id ? "PATCH" : "POST",
        body,
      });
      router.push("/admin/jobs");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function updateSection(index: number, field: "title" | "content", value: string) {
    setContentSections((current) => current.map((section, sectionIndex) =>
      sectionIndex === index ? { ...section, [field]: value } : section
    ));
  }

  function moveSection(index: number, direction: -1 | 1) {
    setContentSections((current) => {
      const destination = index + direction;
      if (destination < 0 || destination >= current.length) return current;
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  function addSection() {
    setContentSections((current) => [
      ...current,
      { id: `custom-${crypto.randomUUID()}`, title: "Additional section", content: "" },
    ]);
  }

  if (loading) return <LoadingBlock label="Loading job" />;

  return (
    <>
      <PageIntro title={id ? "Edit job" : "Create a job"} body="Define the public role and its hiring requirements." />
      {error ? <Feedback tone="error">{error}</Feedback> : null}
      <form className="panel job-editor" onSubmit={submit}>
        <section>
          <h2>Role basics</h2>
          <div className="form-grid">
            <label><span>Job title</span><input name="title" defaultValue={job?.title} required /></label>
            <label><span>Public job code</span><input name="public_code" defaultValue={job?.public_code} placeholder="Generated when empty" readOnly={Boolean(job)} /><small>{job ? "Stable Job ID" : "Generated when empty"}</small></label>
            <label><span>Department</span><input name="department" defaultValue={job?.department} /></label>
            <label><span>Employment type</span><select name="employment_type" defaultValue={job?.employment_type || "Full-time"}><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option></select></label>
            <label><span>Experience level</span><input name="experience_level" defaultValue={job?.experience_level} /></label>
            <label><span>Openings</span><input type="number" name="openings" min="1" defaultValue={job?.openings || 1} /></label>
            <label><span>Location</span><input name="location" defaultValue={job?.location} /></label>
            <label><span>Workplace model</span><select name="workplace_model" defaultValue={job?.workplace_model || "Hybrid"}><option>On-site</option><option>Hybrid</option><option>Remote</option></select></label>
            <label><span>Status</span><select name="status" defaultValue={job?.status || "draft"}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="published">Published</option><option value="paused">Paused</option><option value="closed">Closed</option><option value="archived">Archived</option></select></label>
            <label><span>Application deadline</span><input name="application_deadline" type="datetime-local" defaultValue={job?.application_deadline?.slice(0, 16)} /></label>
            <label><span>Application status label</span><input name="application_status_text" defaultValue={job?.application_status_text} placeholder="Applications open" /><small>Shown beside the calendar icon.</small></label>
          </div>
        </section>
        <section>
          <h2>Role content</h2>
          <label><span>Role summary</span><textarea name="role_summary" rows={4} defaultValue={job?.role_summary} required /></label>
          <div className="content-section-editor">
            {contentSections.map((section, index) => (
              <div className="content-section-row" key={section.id}>
                <div className="content-section-heading">
                  <strong>Section {index + 1}</strong>
                  <div className="section-actions">
                    <button type="button" className="icon-button" aria-label="Move section up" title="Move section up" disabled={index === 0} onClick={() => moveSection(index, -1)}><ArrowUp size={16} /></button>
                    <button type="button" className="icon-button" aria-label="Move section down" title="Move section down" disabled={index === contentSections.length - 1} onClick={() => moveSection(index, 1)}><ArrowDown size={16} /></button>
                    <button type="button" className="icon-button icon-button-danger" aria-label="Remove section" title="Remove section" onClick={() => setContentSections((current) => current.filter((_, sectionIndex) => sectionIndex !== index))}><Trash2 size={16} /></button>
                  </div>
                </div>
                <label><span>Heading</span><input value={section.title} onChange={(event) => updateSection(index, "title", event.target.value)} required /></label>
                <label><span>Content</span><textarea rows={5} value={section.content} onChange={(event) => updateSection(index, "content", event.target.value)} /></label>
              </div>
            ))}
            <button type="button" className="button button-secondary add-section-button" onClick={addSection}><Plus size={17} />Add section</button>
          </div>
        </section>
        <div className="form-actions">
          <button type="button" className="button button-secondary" onClick={() => router.back()}>Cancel</button>
          <button className="button button-primary" disabled={saving}>{saving ? "Saving" : "Save job"}</button>
        </div>
      </form>
    </>
  );
}
