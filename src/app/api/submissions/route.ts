import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { hashIp, isRateLimited } from "@/lib/rate-limit";
import type { PublicSubmissionInput } from "@/lib/types";

const LIMITS = {
  name: { min: 2, max: 80 },
  department: { min: 2, max: 60 },
  message: { min: 5, max: 600 },
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export async function POST(req: NextRequest) {
  let body: PublicSubmissionInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot: a hidden field real users never fill. Bots that auto-fill every
  // field will trip this silently — we return a fake success so they move on.
  if (clean(body.honeypot)) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const name = clean(body.name);
  const department = clean(body.department);
  const message = clean(body.message);

  const errors: Record<string, string> = {};
  if (name.length < LIMITS.name.min || name.length > LIMITS.name.max) {
    errors.name = `Name should be ${LIMITS.name.min}-${LIMITS.name.max} characters.`;
  }
  if (department.length < LIMITS.department.min || department.length > LIMITS.department.max) {
    errors.department = `Department should be ${LIMITS.department.min}-${LIMITS.department.max} characters.`;
  }
  if (message.length < LIMITS.message.min || message.length > LIMITS.message.max) {
    errors.message = `Your guess should be ${LIMITS.message.min}-${LIMITS.message.max} characters.`;
  }
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Validation failed.", fields: errors }, { status: 422 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const ipHash = hashIp(ip);

  if (isRateLimited(ipHash)) {
    return NextResponse.json(
      { error: "You're guessing a little too fast — try again in a minute." },
      { status: 429 }
    );
  }

  const supabase = getAdminClient();
  const { error } = await supabase.from("submissions").insert({
    name,
    department,
    message,
    ip_hash: ipHash,
  });

  if (error) {
    console.error("submission insert failed", error);
    return NextResponse.json(
      { error: "Something went wrong on our end. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
