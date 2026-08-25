import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, SESSION_COOKIE_MAX_AGE } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Basic brute-force throttle for the login route itself.
const attempts = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

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

  const { password } = await req.json().catch(() => ({ password: "" }));
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return NextResponse.json(
      { error: "Server is missing ADMIN_PASSWORD configuration." },
      { status: 500 }
    );
  }

  if (typeof password !== "string" || password !== expected) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = await createSessionToken();
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
