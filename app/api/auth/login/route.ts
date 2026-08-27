import { createSession, verifyPassword } from "@/lib/auth";
import { loginInputSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Password required." }, { status: 400 });
  }

  const ok = await verifyPassword(parsed.data.password);
  if (!ok) {
    // Same message either way — don't reveal whether the account/password specifically is wrong.
    return Response.json({ error: "Incorrect password." }, { status: 401 });
  }

  await createSession();
  return Response.json({ ok: true });
}
