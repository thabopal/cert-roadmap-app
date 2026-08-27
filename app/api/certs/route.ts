import { requireAdmin } from "@/lib/auth";
import { createCert, getCerts } from "@/lib/roadmap";
import { certInputSchema } from "@/lib/validation";

// Public read — the whole point is anyone with the link can view the roadmap.
export async function GET() {
  const certs = await getCerts();
  return Response.json({ certs });
}

// Admin-only write — content changes require the session cookie from /api/auth/login.
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const parsed = certInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid cert payload.", issues: parsed.error.issues }, { status: 400 });
  }

  const existing = await getCerts();
  if (existing.some((c) => c.id === parsed.data.id)) {
    return Response.json({ error: `A cert with id "${parsed.data.id}" already exists.` }, { status: 409 });
  }

  const cert = await createCert(parsed.data);
  return Response.json({ cert }, { status: 201 });
}
