import { getCerts, getPageMeta, getProgressMap } from "@/lib/roadmap";
import { collectChecklistIds } from "@/lib/types";
import { ProgressProvider } from "@/components/ProgressStore";
import { ProgressTile } from "@/components/ProgressTile";
import { TopControls } from "@/components/TopControls";
import { CertCard } from "@/components/CertCard";
import Link from "next/link";

// Reads straight from Postgres on every request (no caching) — this is a
// single-owner tool with low traffic, and correctness after an admin edit
// matters more than shaving a DB round trip.
export const dynamic = "force-dynamic";

// Runs before hydration to set data-theme from the last choice stored in this
// browser, so there's no light-mode flash for a viewer who picked dark.
const THEME_INIT_SCRIPT = `
try {
  var t = localStorage.getItem('certRoadmapTheme');
  if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
`;

export default async function Home() {
  const [meta, year1, year2plus, progress] = await Promise.all([
    getPageMeta(),
    getCerts("year1"),
    getCerts("year2plus"),
    getProgressMap(),
  ]);

  if (!meta) {
    return (
      <div className="wrap">
        <p className="load-error">
          No page content found. Run <code>npm run seed</code> against this database to load the roadmap, or add
          content from <Link href="/admin">/admin</Link>.
        </p>
      </div>
    );
  }

  const allIds = [...year1, ...year2plus].flatMap((c) => collectChecklistIds(c));

  return (
    <ProgressProvider allIds={allIds} initialProgress={progress}>
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      <TopControls />
      <div className="wrap">
        <header className="page-head">
          <div>
            <h1>{meta.title}</h1>
            <p className="subtitle">{meta.owner}</p>
            <p className="subtitle">{meta.subtitle}</p>
          </div>
        </header>

        <ProgressTile />

        <p className="strip-label">Year 1 — Core Five (do these, in order)</p>
        <div className="sequence-strip">
          {year1.map((c, i) => (
            <span key={c.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="seq-pill">
                <b>{c.num}</b> {c.title.split(":")[0]}
              </span>
              {i < year1.length - 1 && <span className="seq-arrow">→</span>}
            </span>
          ))}
        </div>

        <p className="strip-label">Year 2+ — Conditional / Optional (pursue only if the trigger fits)</p>
        <div className="sequence-strip">
          {year2plus.map((c) => (
            <span className="seq-pill optional" key={c.id}>
              {c.shortLabel || c.title}
            </span>
          ))}
        </div>

        <p className="meta-note" dangerouslySetInnerHTML={{ __html: meta.metaNote }} />

        <section className="foundation">
          <h2>{meta.foundational.heading}</h2>
          <div className="found-grid">
            {meta.foundational.items.map((it, i) => (
              <div className="found-item" key={i}>
                <b>{it.title}</b> <span dangerouslySetInnerHTML={{ __html: it.body }} />
              </div>
            ))}
          </div>
        </section>

        {year1.map((cert) => (
          <CertCard cert={cert} optional={false} key={cert.id} />
        ))}

        <section className="tier-intro">
          <h2>{meta.year2Intro.heading}</h2>
          <p>{meta.year2Intro.text}</p>
        </section>

        {year2plus.map((cert) => (
          <CertCard cert={cert} optional={true} key={cert.id} />
        ))}

        <footer className="page-footer">
          {meta.footer} · <Link href="/admin">Admin</Link>
        </footer>
      </div>
    </ProgressProvider>
  );
}
