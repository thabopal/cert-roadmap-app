import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

// Single-admin auth: one password (bcrypt-hashed, stored in an env var — never
// in the database or the repo), one signed session cookie. There's exactly one
// user, so this deliberately skips an auth provider/library — a hand-rolled
// bcrypt check + jose-signed HTTP-only cookie is the whole surface area, and
// it's easy to read top to bottom rather than configured through a framework.

const COOKIE_NAME = "session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is not set (or too short). Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\" and put it in .env.local / your deploy environment."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function verifyPassword(candidate: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    throw new Error(
      "ADMIN_PASSWORD_HASH is not set. Run `npm run hash-password` to generate one."
    );
  }
  return bcrypt.compare(candidate, hash);
}

async function signSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSessionSecret());
}

async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    return payload.sub === "admin" && payload.role === "admin";
  } catch {
    // Expired, malformed, or signed with a different secret — all just "not logged in".
    return false;
  }
}

/** Call from a Route Handler after a verified password to log the admin in. */
export async function createSession(): Promise<void> {
  const token = await signSessionToken();
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Call from a Route Handler to log the admin out. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** True if the current request carries a valid admin session cookie. */
export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

/**
 * Guard for admin-only Route Handlers. Returns null when the caller is
 * authenticated; otherwise returns a 401 Response the route should return
 * immediately:
 *
 *   const denied = await requireAdmin();
 *   if (denied) return denied;
 */
export async function requireAdmin(): Promise<Response | null> {
  const ok = await isAuthenticated();
  if (ok) return null;
  return Response.json({ error: "Not authenticated." }, { status: 401 });
}
