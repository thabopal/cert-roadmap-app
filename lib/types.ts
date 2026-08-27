// Content shape shared by the DB layer, the API routes, and the page renderer.
// Mirrors the JSON schema documented in the original cert-roadmap-site README,
// stored in Postgres as JSONB (see db/schema.sql: certs.facts, certs.blocks,
// page_meta.foundational, page_meta.year2_intro).

export interface WeightItem {
  label: string;
  pct: number;
  display: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
}

export interface ChecklistGroup {
  title: string;
  items: ChecklistItem[];
}

export type Block =
  | { heading: string; type: "prose"; text: string }
  | { heading: string; type: "weights"; items: WeightItem[] }
  | { heading: string; type: "checklist"; items: ChecklistItem[] }
  | { heading: string; type: "checklist-grouped"; groups: ChecklistGroup[] };

export type Tier = "year1" | "year2plus";

export interface Cert {
  id: string;
  tier: Tier;
  num: string;
  title: string;
  issuer: string;
  shortLabel: string | null;
  estTime: string | null;
  trigger: string | null;
  facts: string[];
  blocks: Block[];
  sortOrder: number;
}

export interface FoundationalItem {
  title: string;
  body: string;
}

export interface Foundational {
  heading: string;
  items: FoundationalItem[];
}

export interface Year2Intro {
  heading: string;
  text: string;
}

export interface PageMeta {
  title: string;
  owner: string;
  subtitle: string;
  metaNote: string;
  foundational: Foundational;
  year2Intro: Year2Intro;
  footer: string;
}

export interface RoadmapData {
  meta: PageMeta;
  year1: Cert[];
  year2plus: Cert[];
}

// Every checklist item id across every cert must be globally unique — it's the
// primary key used by the progress table. This walks a cert's blocks and
// collects them, used by both the seed script (to sanity-check the source
// JSON) and the page (to compute the "X of Y checked off" total).
export function collectChecklistIds(cert: Pick<Cert, "blocks">): string[] {
  const ids: string[] = [];
  for (const block of cert.blocks) {
    if (block.type === "checklist") {
      ids.push(...block.items.map((i) => i.id));
    } else if (block.type === "checklist-grouped") {
      for (const group of block.groups) {
        ids.push(...group.items.map((i) => i.id));
      }
    }
  }
  return ids;
}
