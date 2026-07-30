"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { Feedback } from "@/components/ui";

type Employment = {
  id?: string;
  company: string;
  job_title: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  responsibilities?: string;
  achievements?: string;
  location?: string;
};

type EmploymentFormProps = {
  initialEmployment: Employment[];
  onUpdate: (employment: Employment[]) => void;
};

export function EmploymentForm({ initialEmployment, onUpdate }: EmploymentFormProps) {
  const [employment, setEmployment] = useState<Employment[]>(initialEmployment);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const form = new FormData(event.currentTarget);
    const body = {
      company: String(form.get("company") || "").trim(),
      job_title: String(form.get("job_title") || "").trim(),
      start_date: String(form.get("start_date") || "").trim() || undefined,
      end_date: String(form.get("end_date") || "").trim() || undefined,
      is_current: form.get("is_current") === "on",
      responsibilities: String(form.get("responsibilities") || "").trim() || undefined,
      achievements: String(form.get("achievements") || "").trim() || undefined,
      location: String(form.get("location") || "").trim() || undefined,
    };

    try {
      const response = await api<{ employment: Employment }>("/candidate/employment", {
        method: "POST",
        body,
      });
      const updated = [...employment, response.employment];
      setEmployment(updated);
      onUpdate(updated);
      setSuccess("Employment added successfully");
      setIsAdding(false);
      (event.target as HTMLFormElement).reset();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to add employment");
    }
  }

  async function handleUpdate(id: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const form = new FormData(event.currentTarget);
    const body = {
      company: String(form.get("company") || "").trim(),
      job_title: String(form.get("job_title") || "").trim(),
      start_date: String(form.get("start_date") || "").trim() || undefined,
      end_date: String(form.get("end_date") || "").trim() || undefined,
      is_current: form.get("is_current") === "on",
      responsibilities: String(form.get("responsibilities") || "").trim() || undefined,
      achievements: String(form.get("achievements") || "").trim() || undefined,
      location: String(form.get("location") || "").trim() || undefined,
    };

    try {
      const response = await api<{ employment: Employment }>(`/candidate/employment/${id}`, {
        method: "PATCH",
        body,
      });
      const updated = employment.map((item) => (item.id === id ? response.employment : item));
      setEmployment(updated);
      onUpdate(updated);
      setSuccess("Employment updated successfully");
      setEditingId(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to update employment");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this employment entry?")) return;

    setError("");
    setSuccess("");

    try {
      await api(`/candidate/employment/${id}`, { method: "DELETE" });
      const updated = employment.filter((item) => item.id !== id);
      setEmployment(updated);
      onUpdate(updated);
      setSuccess("Employment deleted successfully");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to delete employment");
    }
  }

  function formatDate(dateString?: string): string {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  }

  function renderForm(item?: Employment, onSubmit?: (e: FormEvent<HTMLFormElement>) => void) {
    return (
      <form className="employment-entry-form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label>
            <span>Company *</span>
            <input name="company" required defaultValue={item?.company} />
          </label>
          <label>
            <span>Job Title *</span>
            <input name="job_title" required defaultValue={item?.job_title} />
          </label>
          <label>
            <span>Location</span>
            <input name="location" defaultValue={item?.location} />
          </label>
          <label>
            <span>Start Date</span>
            <input name="start_date" type="date" defaultValue={item?.start_date} />
          </label>
          <label>
            <span>End Date</span>
            <input name="end_date" type="date" defaultValue={item?.end_date} disabled={item?.is_current} />
          </label>
        </div>
        <label className="checkbox-label">
          <input type="checkbox" name="is_current" defaultChecked={item?.is_current} />
          <span>Currently working here</span>
        </label>
        <label>
          <span>Responsibilities</span>
          <textarea name="responsibilities" rows={3} defaultValue={item?.responsibilities} />
        </label>
        <label>
          <span>Achievements</span>
          <textarea name="achievements" rows={3} defaultValue={item?.achievements} />
        </label>
        <div className="form-actions">
          <button type="submit" className="button button-primary">
            {item ? "Update" : "Add"}
          </button>
          <button
            type="button"
            className="button"
            onClick={() => {
              setIsAdding(false);
              setEditingId(null);
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <section className="employment-section">
      <div className="section-header">
        <h2>Employment History</h2>
        {!isAdding && (
          <button className="button button-sm" onClick={() => setIsAdding(true)}>
            + Add Employment
          </button>
        )}
      </div>

      {error && <Feedback tone="error">{error}</Feedback>}
      {success && <Feedback tone="success">{success}</Feedback>}

      {isAdding && renderForm(undefined, handleAdd)}

      <div className="employment-list">
        {employment.map((item) => (
          <div key={item.id} className="employment-entry">
            {editingId === item.id ? (
              renderForm(item, (e) => handleUpdate(item.id!, e))
            ) : (
              <>
                <div className="employment-header">
                  <h3>{item.job_title}</h3>
                  <div className="employment-actions">
                    <button className="button button-sm" onClick={() => setEditingId(item.id!)}>
                      Edit
                    </button>
                    <button className="button button-sm button-danger" onClick={() => handleDelete(item.id!)}>
                      Delete
                    </button>
                  </div>
                </div>
                <p className="company">{item.company}</p>
                {item.location && <p className="location">{item.location}</p>}
                <p className="dates">
                  {formatDate(item.start_date)} - {item.is_current ? "Present" : formatDate(item.end_date)}
                </p>
                {item.responsibilities && (
                  <div className="responsibilities">
                    <strong>Responsibilities:</strong>
                    <p>{item.responsibilities}</p>
                  </div>
                )}
                {item.achievements && (
                  <div className="achievements">
                    <strong>Achievements:</strong>
                    <p>{item.achievements}</p>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {employment.length === 0 && !isAdding && (
        <p className="empty-state">No employment entries yet. Click &quot;Add Employment&quot; to get started.</p>
      )}
    </section>
  );
}
