// One-time (or re-runnable) import of the original roadmap.json content into
// Postgres. Run against a fresh database after applying db/schema.sql:
//
//   psql "$DATABASE_URL" -f db/schema.sql
//   npm run seed
//
// Safe to re-run: every cert/progress/meta row is upserted by primary key, so
// running it twice just overwrites content rows with the same JSON again. It
// does NOT touch progress — your checked-off items survive a re-seed.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { config } from "dotenv";

// Next.js loads .env.local automatically; a standalone tsx script doesn't, so
// load it explicitly before importing anything that reads process.env.
config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env.local") });
import { collectChecklistIds, type Block, type Foundational, type Year2Intro } from "../lib/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The source content lives in the older static-site build. Point this at a
// local roadmap.json export if that folder isn't present alongside this repo.
const SOURCE_PATH =
  process.env.ROADMAP_JSON_PATH ??
  path.resolve(__dirname, "../../cert-roadmap-site/data/roadmap.json");

interface SourceCert {
  id: string;
  num: string;
  title: string;
  issuer: string;
  facts: string[];
  estTime?: string;
  trigger?: string;
  shortLabel?: string;
  blocks: Block[];
}

interface SourceData {
  meta: { title: string; owner: string; subtitle: string; metaNote: string };
  foundational: Foundational;
  year1: SourceCert[];
  year2Intro: Year2Intro;
  year2plus: SourceCert[];
  footer: string;
}

async function main() {
  // Imported lazily, after dotenv has populated process.env above (this
  // module reads DATABASE_URL at import time).
  const { db } = await import("../lib/db");

  const raw = readFileSync(SOURCE_PATH, "utf-8");
  const data: SourceData = JSON.parse(raw);

  // Sanity check before writing anything: every checklist id must be unique
  // across the whole roadmap (see lib/types.ts) — progress rows key off it.
  const allCerts = [...data.year1, ...data.year2plus];
  const allIds = allCerts.flatMap((c) => collectChecklistIds(c));
  const dupes = allIds.filter((id, i) => allIds.indexOf(id) !== i);
  if (dupes.length) {
    throw new Error(`Duplicate checklist ids found, aborting seed: ${[...new Set(dupes)].join(", ")}`);
  }

  await db.transaction().execute(async (trx) => {
    for (const [tier, certs] of [
      ["year1", data.year1],
      ["year2plus", data.year2plus],
    ] as const) {
      for (let i = 0; i < certs.length; i++) {
        const c = certs[i];
        await trx
          .insertInto("certs")
          .values({
            id: c.id,
            tier,
            num: c.num,
            title: c.title,
            issuer: c.issuer,
            short_label: c.shortLabel ?? null,
            est_time: c.estTime ?? null,
            trigger_note: c.trigger ?? null,
            facts: JSON.stringify(c.facts) as unknown as string[],
            blocks: JSON.stringify(c.blocks) as unknown as Block[],
            sort_order: i,
          })
          .onConflict((oc) =>
            oc.column("id").doUpdateSet({
              tier,
              num: c.num,
              title: c.title,
              issuer: c.issuer,
              short_label: c.shortLabel ?? null,
              est_time: c.estTime ?? null,
              trigger_note: c.trigger ?? null,
              facts: JSON.stringify(c.facts) as unknown as string[],
              blocks: JSON.stringify(c.blocks) as unknown as Block[],
              sort_order: i,
            })
          )
          .execute();
      }
    }

    await trx
      .insertInto("page_meta")
      .values({
        id: 1,
        title: data.meta.title,
        owner: data.meta.owner,
        subtitle: data.meta.subtitle,
        meta_note: data.meta.metaNote,
        foundational: JSON.stringify(data.foundational) as unknown as Foundational,
        year2_intro: JSON.stringify(data.year2Intro) as unknown as Year2Intro,
        footer: data.footer,
      })
      .onConflict((oc) =>
        oc.column("id").doUpdateSet({
          title: data.meta.title,
          owner: data.meta.owner,
          subtitle: data.meta.subtitle,
          meta_note: data.meta.metaNote,
          foundational: JSON.stringify(data.foundational) as unknown as Foundational,
          year2_intro: JSON.stringify(data.year2Intro) as unknown as Year2Intro,
          footer: data.footer,
        })
      )
      .execute();
  });

  console.log(`Seeded ${allCerts.length} certs + page_meta from ${SOURCE_PATH}`);
  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
