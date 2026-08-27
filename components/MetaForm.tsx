"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PageMeta } from "@/lib/types";

export function MetaForm({ initial }: { initial: PageMeta }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [owner, setOwner] = useState(initial.owner);
  const [subtitle, setSubtitle] = useState(initial.subtitle);
  const [metaNote, setMetaNote] = useState(initial.metaNote);
  const [footer, setFooter] = useState(initial.footer);
  const [foundationalJson, setFoundationalJson] = useState(JSON.stringify(initial.foundational, null, 2));
  const [year2IntroJson, setYear2IntroJson] = useState(JSON.stringify(initial.year2Intro, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    let foundational: unknown, year2Intro: unknown;
    try {
      foundational = JSON.parse(foundationalJson);
    } catch {
      setError("Foundational section isn't valid JSON.");
      setBusy(false);
      return;
    }
    try {
      year2Intro = JSON.parse(year2IntroJson);
    } catch {
      setError("Year 2+ intro isn't valid JSON.");
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/meta", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, owner, subtitle, metaNote, footer, foundational, year2Intro }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Save failed.");
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-shell wide">
      <div className="admin-card">
        <h1>Page content</h1>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="owner">Owner line</label>
            <input id="owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="subtitle">Subtitle</label>
            <input id="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="metaNote">Meta note (HTML allowed — e.g. &lt;a&gt;/&lt;code&gt;)</label>
            <textarea id="metaNote" value={metaNote} onChange={(e) => setMetaNote(e.target.value)} style={{ minHeight: 100 }} />
          </div>
          <div className="field">
            <label htmlFor="foundational">
              Foundational section (JSON — {"{heading, items:[{title, body}]}"})
            </label>
            <textarea id="foundational" value={foundationalJson} onChange={(e) => setFoundationalJson(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="year2Intro">Year 2+ intro (JSON — {"{heading, text}"})</label>
            <textarea id="year2Intro" value={year2IntroJson} onChange={(e) => setYear2IntroJson(e.target.value)} style={{ minHeight: 100 }} />
          </div>
          <div className="field">
            <label htmlFor="footer">Footer</label>
            <textarea id="footer" value={footer} onChange={(e) => setFooter(e.target.value)} style={{ minHeight: 70 }} />
          </div>
          <div className="btn-row">
            <button className="btn" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </button>
            <button type="button" className="btn secondary" onClick={() => router.push("/admin")} disabled={busy}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
