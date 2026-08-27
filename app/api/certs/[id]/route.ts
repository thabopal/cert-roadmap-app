import { requireAdmin } from "@/lib/auth";
import { deleteCert, getCertById, updateCert } from "@/lib/roadmap";
import { certInputSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const cert = await getCertById(id);
  if (!cert) return Response.json({ error: "Not found." }, { status: 404 });
  return Response.json({ cert });
}

export async function PUT(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const existing = await getCertById(id);
  if (!existing) return Response.json({ error: "Not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = certInputSchema.safeParse({ ...body, id });
  if (!parsed.success) {
    return Response.json({ error: "Invalid cert payload.", issues: parsed.error.issues }, { status: 400 });
  }

  const cert = await updateCert(id, {
    tier: parsed.data.tier,
    num: parsed.data.num,
    title: parsed.data.title,
    issuer: parsed.data.issuer,
    shortLabel: parsed.data.shortLabel,
    estTime: parsed.data.estTime,
    trigger: parsed.data.trigger,
    facts: parsed.data.facts,
    blocks: parsed.data.blocks,
    sortOrder: parsed.data.sortOrder,
  });
  return Response.json({ cert });
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const existing = await getCertById(id);
  if (!existing) return Response.json({ error: "Not found." }, { status: 404 });

  await deleteCert(id);
  return Response.json({ ok: true });
}
