-- Certification Roadmap schema.
-- Run this once against a fresh database (local Postgres or Neon) before first use.
-- Safe to re-run: every statement is idempotent (CREATE ... IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS certs (
  id          TEXT PRIMARY KEY,
  tier        TEXT NOT NULL CHECK (tier IN ('year1', 'year2plus')),
  num         TEXT NOT NULL,
  title       TEXT NOT NULL,
  issuer      TEXT NOT NULL,
  short_label TEXT,
  est_time    TEXT,
  trigger_note TEXT,
  facts       JSONB NOT NULL DEFAULT '[]',
  blocks      JSONB NOT NULL DEFAULT '[]',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS certs_tier_order_idx ON certs (tier, sort_order);

-- One row per checklist item id (e.g. "itil-1"). Global, unauthenticated read/write —
-- this is low-stakes personal progress state, not sensitive content. See README for
-- the reasoning on why this table has no auth gate while `certs` writes do.
CREATE TABLE IF NOT EXISTS progress (
  item_id    TEXT PRIMARY KEY,
  done       BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Single-row table for page-level content (title, subtitle, footer, etc).
-- Enforced to exactly one row via the id=1 check.
CREATE TABLE IF NOT EXISTS page_meta (
  id             INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  title          TEXT NOT NULL,
  owner          TEXT NOT NULL,
  subtitle       TEXT NOT NULL,
  meta_note      TEXT NOT NULL,
  foundational   JSONB NOT NULL DEFAULT '{}',
  year2_intro    JSONB NOT NULL DEFAULT '{}',
  footer         TEXT NOT NULL DEFAULT '',
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Keep updated_at current automatically on any UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS certs_set_updated_at ON certs;
CREATE TRIGGER certs_set_updated_at BEFORE UPDATE ON certs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS progress_set_updated_at ON progress;
CREATE TRIGGER progress_set_updated_at BEFORE UPDATE ON progress
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS page_meta_set_updated_at ON page_meta;
CREATE TRIGGER page_meta_set_updated_at BEFORE UPDATE ON page_meta
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
