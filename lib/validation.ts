import { z } from "zod";

// Mirrors lib/types.ts's Block union — kept separate because zod schemas and
// TypeScript types are declared differently, not because the shapes differ.
const weightItem = z.object({ label: z.string(), pct: z.number(), display: z.string() });
const checklistItem = z.object({ id: z.string().min(1), text: z.string() });
const checklistGroup = z.object({ title: z.string(), items: z.array(checklistItem) });

export const blockSchema = z.discriminatedUnion("type", [
  z.object({ heading: z.string(), type: z.literal("prose"), text: z.string() }),
  z.object({ heading: z.string(), type: z.literal("weights"), items: z.array(weightItem) }),
  z.object({ heading: z.string(), type: z.literal("checklist"), items: z.array(checklistItem) }),
  z.object({ heading: z.string(), type: z.literal("checklist-grouped"), groups: z.array(checklistGroup) }),
]);

export const certInputSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "id must be lowercase letters, numbers, and hyphens only"),
  tier: z.enum(["year1", "year2plus"]),
  num: z.string().min(1).max(8),
  title: z.string().min(1),
  issuer: z.string().min(1),
  shortLabel: z.string().nullable().default(null),
  estTime: z.string().nullable().default(null),
  trigger: z.string().nullable().default(null),
  facts: z.array(z.string()),
  blocks: z.array(blockSchema),
  sortOrder: z.number().int(),
});

export const pageMetaSchema = z.object({
  title: z.string().min(1),
  owner: z.string().min(1),
  subtitle: z.string(),
  metaNote: z.string(),
  foundational: z.object({
    heading: z.string(),
    items: z.array(z.object({ title: z.string(), body: z.string() })),
  }),
  year2Intro: z.object({ heading: z.string(), text: z.string() }),
  footer: z.string(),
});

export const progressInputSchema = z.object({
  itemId: z.string().min(1),
  done: z.boolean(),
});

export const loginInputSchema = z.object({
  password: z.string().min(1),
});
