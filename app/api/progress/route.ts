import { getProgressMap, setProgress } from "@/lib/roadmap";
import { progressInputSchema } from "@/lib/validation";

// Deliberately unauthenticated — see db/schema.sql's comment on the progress
// table. This is low-stakes personal checklist state (not the roadmap
// content), and requiring login here would defeat the point of "check a box
// on my phone, see it checked on my laptop" without meaningfully protecting
// anything.

export async function GET() {
  const progress = await getProgressMap();
  return Response.json({ progress });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = progressInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid progress payload.", issues: parsed.error.issues }, { status: 400 });
  }
  await setProgress(parsed.data.itemId, parsed.data.done);
  return Response.json({ ok: true });
}
