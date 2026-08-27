import { db, type CertsTable } from "./db";
import type { Cert, PageMeta, Tier } from "./types";
import type { Selectable } from "kysely";

function rowToCert(row: Selectable<CertsTable>): Cert {
  return {
    id: row.id,
    tier: row.tier,
    num: row.num,
    title: row.title,
    issuer: row.issuer,
    shortLabel: row.short_label,
    estTime: row.est_time,
    trigger: row.trigger_note,
    facts: row.facts,
    blocks: row.blocks,
    sortOrder: row.sort_order,
  };
}

export async function getCerts(tier?: Tier): Promise<Cert[]> {
  let query = db.selectFrom("certs").selectAll().orderBy("tier").orderBy("sort_order");
  if (tier) query = query.where("tier", "=", tier);
  const rows = await query.execute();
  return rows.map(rowToCert);
}

export async function getCertById(id: string): Promise<Cert | null> {
  const row = await db.selectFrom("certs").selectAll().where("id", "=", id).executeTakeFirst();
  return row ? rowToCert(row) : null;
}

export interface CertInput {
  id: string;
  tier: Tier;
  num: string;
  title: string;
  issuer: string;
  shortLabel: string | null;
  estTime: string | null;
  trigger: string | null;
  facts: Cert["facts"];
  blocks: Cert["blocks"];
  sortOrder: number;
}

export async function createCert(input: CertInput): Promise<Cert> {
  const row = await db
    .insertInto("certs")
    .values({
      id: input.id,
      tier: input.tier,
      num: input.num,
      title: input.title,
      issuer: input.issuer,
      short_label: input.shortLabel,
      est_time: input.estTime,
      trigger_note: input.trigger,
      // node-postgres serializes a JS array parameter as a Postgres array
      // literal ("{a,b}"), not JSON — wrong for a jsonb column. Stringify
      // ourselves so Postgres gets real JSON text; the `as unknown as` cast
      // is because the column's *read* type (string[]/Block[], for callers
      // selecting rows) is intentionally the parsed shape, not this string.
      facts: JSON.stringify(input.facts) as unknown as Cert["facts"],
      blocks: JSON.stringify(input.blocks) as unknown as Cert["blocks"],
      sort_order: input.sortOrder,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  return rowToCert(row);
}

export async function updateCert(id: string, input: Omit<CertInput, "id">): Promise<Cert> {
  const row = await db
    .updateTable("certs")
    .set({
      tier: input.tier,
      num: input.num,
      title: input.title,
      issuer: input.issuer,
      short_label: input.shortLabel,
      est_time: input.estTime,
      trigger_note: input.trigger,
      facts: JSON.stringify(input.facts) as unknown as Cert["facts"],
      blocks: JSON.stringify(input.blocks) as unknown as Cert["blocks"],
      sort_order: input.sortOrder,
    })
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirstOrThrow();
  return rowToCert(row);
}

export async function deleteCert(id: string): Promise<void> {
  await db.deleteFrom("certs").where("id", "=", id).execute();
  // Progress rows for this cert's checklist items are intentionally left
  // behind (they're keyed by checklist item id, not cert id, and are cheap,
  // harmless orphans) rather than requiring the caller to know every
  // checklist id up front just to clean them up.
}

export async function getPageMeta(): Promise<PageMeta | null> {
  const row = await db.selectFrom("page_meta").selectAll().where("id", "=", 1).executeTakeFirst();
  if (!row) return null;
  return {
    title: row.title,
    owner: row.owner,
    subtitle: row.subtitle,
    metaNote: row.meta_note,
    foundational: row.foundational,
    year2Intro: row.year2_intro,
    footer: row.footer,
  };
}

export async function updatePageMeta(input: PageMeta): Promise<PageMeta> {
  const row = await db
    .updateTable("page_meta")
    .set({
      title: input.title,
      owner: input.owner,
      subtitle: input.subtitle,
      meta_note: input.metaNote,
      foundational: JSON.stringify(input.foundational) as unknown as PageMeta["foundational"],
      year2_intro: JSON.stringify(input.year2Intro) as unknown as PageMeta["year2Intro"],
      footer: input.footer,
    })
    .where("id", "=", 1)
    .returningAll()
    .executeTakeFirstOrThrow();
  return {
    title: row.title,
    owner: row.owner,
    subtitle: row.subtitle,
    metaNote: row.meta_note,
    foundational: row.foundational,
    year2Intro: row.year2_intro,
    footer: row.footer,
  };
}

export async function getProgressMap(): Promise<Record<string, boolean>> {
  const rows = await db.selectFrom("progress").select(["item_id", "done"]).execute();
  const map: Record<string, boolean> = {};
  for (const r of rows) map[r.item_id] = r.done;
  return map;
}

export async function setProgress(itemId: string, done: boolean): Promise<void> {
  await db
    .insertInto("progress")
    .values({ item_id: itemId, done })
    .onConflict((oc) => oc.column("item_id").doUpdateSet({ done }))
    .execute();
}
