"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { Feedback } from "@/components/ui";

type Education = {
  id?: string;
  institution: string;
  degree: string;
  field_of_study?: string;
  start_year?: number;
  end_year?: number;
  is_current?: boolean;
  grade?: string;
  description?: string;
};

type EducationFormProps = {
  initialEducation: Education[];
  onUpdate: (education: Education[]) => void;
};

export function EducationForm({ initialEducation, onUpdate }: EducationFormProps) {
  const [education, setEducation] = useState<Education[]>(initialEducation);
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
      institution: String(form.get("institution") || "").trim(),
      degree: String(form.get("degree") || "").trim(),
      field_of_study: String(form.get("field_of_study") || "").trim() || undefined,
      start_year: form.get("start_year") ? Number(form.get("start_year")) : undefined,
      end_year: form.get("end_year") ? Number(form.get("end_year")) : undefined,
      is_current: form.get("is_current") === "on",
      grade: String(form.get("grade") || "").trim() || undefined,
      description: String(form.get("description") || "").trim() || undefined,
    };

    try {
      const response = await api<{ education: Education }>("/candidate/education", {
        method: "POST",
        body,
      });
      const updated = [...education, response.education];
      setEducation(updated);
      onUpdate(updated);
      setSuccess("Education added successfully");
      setIsAdding(false);
      (event.target as HTMLFormElement).reset();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to add education");
    }
  }

  async function handleUpdate(id: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const form = new FormData(event.currentTarget);
    const body = {
      institution: String(form.get("institution") || "").trim(),
      degree: String(form.get("degree") || "").trim(),
      field_of_study: String(form.get("field_of_study") || "").trim() || undefined,
      start_year: form.get("start_year") ? Number(form.get("start_year")) : undefined,
      end_year: form.get("end_year") ? Number(form.get("end_year")) : undefined,
      is_current: form.get("is_current") === "on",
      grade: String(form.get("grade") || "").trim() || undefined,
      description: String(form.get("description") || "").trim() || undefined,
    };

    try {
      const response = await api<{ education: Education }>(`/candidate/education/${id}`, {
        method: "PATCH",
        body,
      });
      const updated = education.map((item) => (item.id === id ? response.education : item));
      setEducation(updated);
      onUpdate(updated);
      setSuccess("Education updated successfully");
      setEditingId(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to update education");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this education entry?")) return;

    setError("");
    setSuccess("");

    try {
      await api(`/candidate/education/${id}`, { method: "DELETE" });
      const updated = education.filter((item) => item.id !== id);
      setEducation(updated);
      onUpdate(updated);
      setSuccess("Education deleted successfully");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to delete education");
    }
  }

  function renderForm(item?: Education, onSubmit?: (e: FormEvent<HTMLFormElement>) => void) {
    return (
      <form className="education-entry-form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label>
            <span>Institution *</span>
            <input name="institution" required defaultValue={item?.institution} />
          </label>
          <label>
            <span>Degree *</span>
            <input name="degree" required defaultValue={item?.degree} />
          </label>
          <label>
            <span>Field of Study</span>
            <input name="field_of_study" defaultValue={item?.field_of_study} />
          </label>
          <label>
            <span>Grade/CGPA</span>
            <input name="grade" defaultValue={item?.grade} />
          </label>
          <label>
            <span>Start Year</span>
            <input name="start_year" type="number" min="1950" max="2030" defaultValue={item?.start_year} />
          </label>
          <label>
            <span>End Year</span>
            <input name="end_year" type="number" min="1950" max="2030" defaultValue={item?.end_year} />
          </label>
        </div>
        <label className="checkbox-label">
          <input type="checkbox" name="is_current" defaultChecked={item?.is_current} />
          <span>Currently studying</span>
        </label>
        <label>
          <span>Description</span>
          <textarea name="description" rows={3} defaultValue={item?.description} />
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
    <section className="education-section">
      <div className="section-header">
        <h2>Education</h2>
        {!isAdding && (
          <button className="button button-sm" onClick={() => setIsAdding(true)}>
            + Add Education
          </button>
        )}
      </div>

      {error && <Feedback tone="error">{error}</Feedback>}
      {success && <Feedback tone="success">{success}</Feedback>}

      {isAdding && renderForm(undefined, handleAdd)}

      <div className="education-list">
        {education.map((item) => (
          <div key={item.id} className="education-entry">
            {editingId === item.id ? (
              renderForm(item, (e) => handleUpdate(item.id!, e))
            ) : (
              <>
                <div className="education-header">
                  <h3>{item.degree}</h3>
                  <div className="education-actions">
                    <button className="button button-sm" onClick={() => setEditingId(item.id!)}>
                      Edit
                    </button>
                    <button className="button button-sm button-danger" onClick={() => handleDelete(item.id!)}>
                      Delete
                    </button>
                  </div>
                </div>
                <p className="institution">{item.institution}</p>
                {item.field_of_study && <p className="field">{item.field_of_study}</p>}
                <p className="years">
                  {item.start_year || "N/A"} - {item.is_current ? "Present" : item.end_year || "N/A"}
                  {item.grade && ` • ${item.grade}`}
                </p>
                {item.description && <p className="description">{item.description}</p>}
              </>
            )}
          </div>
        ))}
      </div>

      {education.length === 0 && !isAdding && (
        <p className="empty-state">No education entries yet. Click &quot;Add Education&quot; to get started.</p>
      )}
    </section>
  );
}
