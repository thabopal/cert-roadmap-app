# Certification Roadmap — Next.js + Postgres

Full-stack rebuild of the certification tracker: Next.js (App Router) serving both the public
roadmap page and a small admin CRUD interface, backed by Postgres. Content (cert entries, page
copy) and progress (checked-off concepts) both live in the database instead of a static JSON
file, so:

- Progress checkboxes sync across every device/browser you open the page on (no more
  browser-local-storage-only tracking).
- Content updates go through a password-protected `/admin` UI instead of hand-editing JSON and
  redeploying.

## Architecture, briefly

- **Next.js 16, App Router, TypeScript.** Public page (`app/page.tsx`) and admin pages
  (`app/admin/**`) are server components that read straight from Postgres; interactive bits
  (checkboxes, forms, theme toggle) are client components.
- **Postgres via `pg` + Kysely** (`lib/db.ts`), not Prisma or an ORM with a code-generation step.
  This started as a Prisma build; Prisma's engine-binary download was blocked by the sandbox this
  was built in, and on reflection a type-safe query builder is arguably the better fit anyway —
  the schema is three small tables (`db/schema.sql`), plain SQL is easy to read end to end, and
  there's no generated client to keep in sync. Kysely gives full TypeScript inference over
  hand-written queries without a build step.
- **Auth: one admin, one password.** `lib/auth.ts` hand-rolls a bcrypt password check + a
  `jose`-signed HTTP-only session cookie. No auth provider/library — there's exactly one user, so
  that would be more moving parts than the problem needs.
- **Two different trust levels, on purpose.** Cert/page content writes (`POST`/`PUT`/`DELETE` on
  `/api/certs`, `/api/meta`) require the admin session. Progress writes (`PUT /api/progress`) are
  deliberately open with no auth — see the comment in `db/schema.sql`. It's low-stakes personal
  checklist state, not content, and gating it would defeat "check a box on your phone, see it
  checked on your laptop" for no real security benefit.
- **Content editing uses JSON textareas for the structured bits** (a cert's `blocks`, the
  foundational-section items) rather than a bespoke visual block editor. For a single-admin tool
  this is a deliberate scope call — the alternative is a much bigger UI for content you'll edit
  occasionally. The API validates whatever JSON you submit with `zod` either way.

## Local development

Prerequisites: Node 20+, a local Postgres instance (or point `DATABASE_URL` at any Postgres,
including a Neon branch).

```bash
npm install

# Apply the schema (safe to re-run)
psql "$DATABASE_URL" -f db/schema.sql

# Copy env template and fill it in — see the notes below on the ADMIN_PASSWORD_HASH escaping gotcha
cp .env.example .env.local

# Import the original roadmap content into the database
npm run seed

npm run dev
```

Open http://localhost:3000. Admin is at `/admin` (redirects to `/admin/login` if you're not
signed in).

### Setting up the admin password

```bash
npm run hash-password -- "your chosen password"
```

This prints a bcrypt hash **and** a copy-pasteable `ADMIN_PASSWORD_HASH=...` line with the `$`
signs pre-escaped. Use that pre-escaped line in `.env.local` — Next.js's env loader expands
unescaped `$word` sequences as variable references (a leftover from generic `.env` interpolation
support), and a raw bcrypt hash is nothing but `$`-delimited segments, so pasting it in unescaped
silently corrupts it and every login attempt fails with no useful error. This only applies to
local `.env*` files; pasted directly into Vercel's dashboard, the hash is stored as a literal
string with no such expansion, so use the *unescaped* hash there.

Also generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deploying (Vercel + Neon)

1. Push this repo to GitHub, import it in Vercel.
2. In the Vercel project, run `vercel install neon` (or add Neon from the Vercel Marketplace in
   the dashboard) — this provisions a Postgres database and injects `DATABASE_URL` automatically.
   (Vercel's own first-party Postgres/KV products were discontinued in favor of these
   marketplace integrations.)
3. Add `ADMIN_PASSWORD_HASH` (unescaped) and `SESSION_SECRET` as project environment variables.
4. Apply the schema against the new database once: `psql "$DATABASE_URL" -f db/schema.sql`, then
   `DATABASE_URL="..." npm run seed` to load the initial content (or start from `/admin` with an
   empty roadmap and add certs there).
5. Deploy. Every future content edit goes through `/admin` — no redeploy needed.

## Updating content

Two ways:

- **Through `/admin`** (recommended for normal edits) — sign in, edit a cert or the page copy,
  save. Changes are live immediately.
- **Directly against the database** — for bulk changes, `db/seed.ts` shows the shape; point
  `ROADMAP_JSON_PATH` at a JSON file matching that schema and re-run `npm run seed` to
  upsert everything at once (progress is left untouched).

Checklist item ids (inside each cert's `blocks`) must stay globally unique across the whole
roadmap — they're the primary key the `progress` table keys off. Reusing an id points saved
progress at the wrong concept.

## Project layout

```
app/                  Routes — public page, /admin/**, /api/**
components/           Client components (forms, checklist, progress state) + CertCard renderer
lib/
  db.ts               Kysely + pg connection (singleton, reused across warm serverless invocations)
  roadmap.ts           Data-access functions (get/create/update/delete certs & meta, progress)
  auth.ts              Password check + session cookie helpers
  types.ts             Shared content types (Cert, Block, PageMeta, ...)
  validation.ts        zod schemas for API input
db/
  schema.sql            Postgres schema (idempotent — safe to re-run)
  seed.ts               Imports roadmap.json content into the database
scripts/
  hash-password.ts      CLI helper to generate ADMIN_PASSWORD_HASH
```
