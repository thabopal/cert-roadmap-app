"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Cert } from "@/lib/types";

type FormState = {
  id: string;
  tier: "year1" | "year2plus";
  num: string;
  title: string;
  issuer: string;
  shortLabel: string;
  estTime: string;
  trigger: string;
  sortOrder: string;
  factsText: string; // one fact per line
  blocksJson: string; // pretty-printed Block[]
};

function certToFormState(cert: Cert): FormState {
  return {
    id: cert.id,
    tier: cert.tier,
    num: cert.num,
    title: cert.title,
    issuer: cert.issuer,
    shortLabel: cert.shortLabel ?? "",
    estTime: cert.estTime ?? "",
    trigger: cert.trigger ?? "",
    sortOrder: String(cert.sortOrder),
    factsText: cert.facts.join("\n"),
    blocksJson: JSON.stringify(cert.blocks, null, 2),
  };
}

const BLANK: FormState = {
  id: "",
  tier: "year1",
  num: "",
  title: "",
  issuer: "",
  shortLabel: "",
  estTime: "",
  trigger: "",
  sortOrder: "0",
  factsText: "",
  blocksJson: `[\n  {\n    "heading": "Overview",\n    "type": "prose",\n    "text": ""\n  }\n]`,
};

export function CertForm({ mode, initial }: { mode: "create" | "edit"; initial?: Cert }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial ? certToFormState(initial) : BLANK);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    let blocks: unknown;
    try {
      blocks = JSON.parse(form.blocksJson);
    } catch {
      setError("Blocks field isn't valid JSON — check for a trailing comma or unmatched bracket.");
      setBusy(false);
      return;
    }

    const payload = {
      id: form.id.trim(),
      tier: form.tier,
      num: form.num.trim(),
      title: form.title.trim(),
      issuer: form.issuer.trim(),
      shortLabel: form.shortLabel.trim() || null,
      estTime: form.estTime.trim() || null,
      trigger: form.trigger.trim() || null,
      sortOrder: Number(form.sortOrder) || 0,
      facts: form.factsText.split("\n").map((f) => f.trim()).filter(Boolean),
      blocks,
    };

    try {
      const url = mode === "create" ? "/api/certs" : `/api/certs/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status}).`);
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    if (!confirm(`Delete "${initial.title}"? This can't be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/certs/${initial.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed.");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
      setBusy(false);
    }
  }

  return (
    <div className="admin-shell wide">
      <div className="admin-card">
        <h1>{mode === "create" ? "New certification" : `Edit: ${initial?.title}`}</h1>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="id">ID (slug — lowercase, hyphens, used in URLs and progress tracking)</label>
            <input
              id="id"
              value={form.id}
              onChange={(e) => set("id", e.target.value)}
              disabled={mode === "edit"}
              placeholder="e.g. aws-saa"
            />
          </div>
          <div className="field">
            <label htmlFor="tier">Tier</label>
            <select id="tier" value={form.tier} onChange={(e) => set("tier", e.target.value as FormState["tier"])}>
              <option value="year1">Year 1 — core five</option>
              <option value="year2plus">Year 2+ — conditional / optional</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="num">Number / letter (shown in the round badge, e.g. &quot;1&quot; or &quot;A&quot;)</label>
            <input id="num" value={form.num} onChange={(e) => set("num", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="sortOrder">Sort order within tier (lower = earlier)</label>
            <input id="sortOrder" type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="issuer">Issuer</label>
            <input id="issuer" value={form.issuer} onChange={(e) => set("issuer", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="shortLabel">Short label (used in the small pill; optional — falls back to title)</label>
            <input id="shortLabel" value={form.shortLabel} onChange={(e) => set("shortLabel", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="estTime">Estimated time (optional — shown as a green pill)</label>
            <input id="estTime" value={form.estTime} onChange={(e) => set("estTime", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="trigger">Trigger condition (Year 2+ only — leave blank for Year 1 certs)</label>
            <input id="trigger" value={form.trigger} onChange={(e) => set("trigger", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="facts">Facts (one per line, shown as pills — e.g. &quot;Format: 40 multiple-choice&quot;)</label>
            <textarea
              id="facts"
              value={form.factsText}
              onChange={(e) => set("factsText", e.target.value)}
              style={{ minHeight: 90 }}
            />
          </div>
          <div className="field">
            <label htmlFor="blocks">
              Content blocks (JSON — array of {"{heading, type, ...}"}; types: prose, weights, checklist,
              checklist-grouped)
            </label>
            <textarea id="blocks" value={form.blocksJson} onChange={(e) => set("blocksJson", e.target.value)} />
            <div className="hint">
              Checklist item ids must be globally unique across every cert &mdash; they&apos;re the primary key for
              saved progress.
            </div>
          </div>

          <div className="btn-row">
            <button className="btn" type="submit" disabled={busy}>
              {busy ? "Saving…" : mode === "create" ? "Create cert" : "Save changes"}
            </button>
            {mode === "edit" && (
              <button type="button" className="btn danger" onClick={handleDelete} disabled={busy}>
                Delete
              </button>
            )}
            <button type="button" className="btn secondary" onClick={() => router.push("/admin")} disabled={busy}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
