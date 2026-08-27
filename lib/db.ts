import { Pool, types as pgTypes } from "pg";
import { Kysely, PostgresDialect, type Generated, type ColumnType } from "kysely";
import type { Block, Foundational, Year2Intro } from "./types";

// node-postgres returns JSONB columns as raw strings unless a type parser is
// registered — without this every `facts`/`blocks` read would need a manual
// JSON.parse() at every call site. OID 3802 is jsonb, 114 is json.
pgTypes.setTypeParser(3802, (val) => JSON.parse(val));
pgTypes.setTypeParser(114, (val) => JSON.parse(val));

// --- Table types, matching db/schema.sql --------------------------------

export interface CertsTable {
  id: string;
  tier: "year1" | "year2plus";
  num: string;
  title: string;
  issuer: string;
  short_label: string | null;
  est_time: string | null;
  trigger_note: string | null;
  facts: string[]; // JSONB
  blocks: Block[]; // JSONB (see lib/types.ts)
  sort_order: number;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

export interface ProgressTable {
  item_id: string;
  done: Generated<boolean>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

export interface PageMetaTable {
  id: Generated<number>;
  title: string;
  owner: string;
  subtitle: string;
  meta_note: string;
  foundational: Foundational; // JSONB
  year2_intro: Year2Intro; // JSONB
  footer: string;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
}

export interface Database {
  certs: CertsTable;
  progress: ProgressTable;
  page_meta: PageMetaTable;
}

// --- Singleton pool/Kysely instance --------------------------------------
// Reused across hot-reloads in dev and across invocations in serverless
// deployment (Vercel Functions keep a warm module scope between requests
// on the same instance).

declare global {
  var __certRoadmapDb: Kysely<Database> | undefined;
}

function createDb(): Kysely<Database> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill in your Postgres/Neon connection string."
    );
  }
  const pool = new Pool({
    connectionString,
    // Neon (and most managed Postgres) require TLS; rejectUnauthorized:false
    // matches Neon's own connection examples for serverless environments.
    ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
    max: 5,
  });
  return new Kysely<Database>({ dialect: new PostgresDialect({ pool }) });
}

export const db: Kysely<Database> = globalThis.__certRoadmapDb ?? createDb();
if (process.env.NODE_ENV !== "production") {
  globalThis.__certRoadmapDb = db;
}
