"use client";

import { useState } from "react";
import { CandidateDirectory } from "@/components/admin-directory";
import { AdminCandidateSearch } from "@/components/admin-candidate-search";
import { PageIntro } from "@/components/ui";

export default function AdminCandidatesPage() {
  const [tab, setTab] = useState<"directory" | "search">("directory");

  return (
    <>
      <PageIntro title="Candidates" body="Browse all registered candidates or run advanced AI-powered search and duplicate detection." />
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
        {(["directory", "search"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 20px",
              border: "none",
              background: "none",
              fontWeight: tab === t ? 700 : 400,
              fontSize: 14,
              cursor: "pointer",
              borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
              color: tab === t ? "var(--accent)" : "var(--muted)",
              marginBottom: -1,
            }}
          >
            {t === "directory" ? "Directory" : "Search & Duplicates"}
          </button>
        ))}
      </div>
      {tab === "directory" ? <CandidateDirectory /> : <AdminCandidateSearch />}
    </>
  );
}
