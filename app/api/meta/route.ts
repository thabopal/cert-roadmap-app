import { requireAdmin } from "@/lib/auth";
import { getPageMeta, updatePageMeta } from "@/lib/roadmap";
import { pageMetaSchema } from "@/lib/validation";

export async function GET() {
  const meta = await getPageMeta();
  if (!meta) return Response.json({ error: "Page content not seeded yet." }, { status: 404 });
  return Response.json({ meta });
}

export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const parsed = pageMetaSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid page meta payload.", issues: parsed.error.issues }, { status: 400 });
  }

  const meta = await updatePageMeta(parsed.data);
  return Response.json({ meta });
}
