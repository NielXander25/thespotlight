import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  ACCOUNTS,
  createSessionToken,
  passwordEnvFor,
  SESSION_COOKIE,
  SESSION_COOKIE_MAX_AGE,
  type Account,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

// Basic brute-force throttle for the login route itself.
const attempts = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

/** Constant-time comparison, so response timing doesn't leak the password. */
function passwordsMatch(given: string, expected: string): boolean {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a minute and try again." },
      { status: 429 }
    );
  }
  recent.push(now);
  attempts.set(ip, recent);

  const body = await req.json().catch(() => ({}));
  const account = (ACCOUNTS as string[]).includes(body.account) ? (body.account as Account) : "admin";
  const password = typeof body.password === "string" ? body.password : "";
  const expected = passwordEnvFor(account);

  if (!expected) {
    const envName = account === "founder" ? "FOUNDER_PASSWORD" : "ADMIN_PASSWORD";
    return NextResponse.json(
      { error: `Server is missing ${envName} configuration.` },
      { status: 500 }
    );
  }

  if (!passwordsMatch(password, expected)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = await createSessionToken(account);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
  return res;
}
