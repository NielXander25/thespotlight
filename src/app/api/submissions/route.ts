import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { hashIp, isRateLimited } from "@/lib/rate-limit";
import type { PublicSubmissionInput } from "@/lib/types";

export const dynamic = "force-dynamic";

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

  const questionId = clean(body.questionId);
  const name = clean(body.name);
  const department = clean(body.department);
  const message = clean(body.message);

  const errors: Record<string, string> = {};
  if (!questionId) {
    return NextResponse.json(
      { error: "Missing question reference. Reload the page and try again." },
      { status: 400 }
    );
  }
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

  const sql = getSql();

  // Confirm the question exists and is still open — never trust the client
  // to only submit against valid/active questions. The uuid regex keeps a
  // malformed id from becoming a database cast error.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(questionId);
  const [question] = isUuid
    ? ((await sql`select id, is_active from questions where id = ${questionId}`) as {
        id: string;
        is_active: boolean;
      }[])
    : [];

  if (!question) {
    return NextResponse.json({ error: "This link is no longer valid." }, { status: 404 });
  }
  if (!question.is_active) {
    return NextResponse.json(
      { error: "This guess isn't accepting responses anymore." },
      { status: 403 }
    );
  }

  try {
    await sql`
      insert into submissions (question_id, name, department, message, ip_hash)
      values (${questionId}, ${name}, ${department}, ${message}, ${ipHash})
    `;
  } catch (error) {
    console.error("submission insert failed", error);
    return NextResponse.json(
      { error: "Something went wrong on our end. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
