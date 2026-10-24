import { NextRequest, NextResponse } from "next/server";
import { getSql, isUniqueViolation } from "@/lib/db";
import { isReservedSlug, slugify, withRandomSuffix } from "@/lib/slug";
import type { QuestionInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Guess counts come from one grouped join rather than N queries.
    const questions = await getSql()`
      select q.*, count(s.id)::int as guess_count
      from questions q
      left join submissions s on s.question_id = q.id
      group by q.id
      order by q.created_at desc
    `;
    return NextResponse.json({ questions });
  } catch (error) {
    console.error("list questions failed", error);
    return NextResponse.json({ error: "Failed to load questions." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body: QuestionInput = await req.json().catch(() => ({} as QuestionInput));

  const title = (body.title ?? "").trim();
  const subtext = (body.subtext ?? "").trim();
  const revealLabel = (body.revealLabel ?? "Monday").trim();
  const requestedSlug = (body.slug ?? "").trim();

  if (title.length < 2 || title.length > 140) {
    return NextResponse.json({ error: "Title should be 2-140 characters." }, { status: 422 });
  }
  if (subtext.length > 240) {
    return NextResponse.json({ error: "Supporting text is too long." }, { status: 422 });
  }
  if (revealLabel.length > 40) {
    return NextResponse.json({ error: "Reveal label is too long." }, { status: 422 });
  }

  let baseSlug = slugify(requestedSlug || title);
  if (isReservedSlug(baseSlug)) {
    baseSlug = withRandomSuffix(baseSlug);
  }

  const sql = getSql();

  // Try the clean slug first, then fall back to a suffixed version on
  // collision (Postgres unique_violation = 23505), a few times.
  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const [question] = await sql`
        insert into questions (slug, title, subtext, reveal_label)
        values (${slug}, ${title}, ${subtext || null}, ${revealLabel || "Monday"})
        returning *
      `;
      return NextResponse.json({ question: { ...question, guess_count: 0 } }, { status: 201 });
    } catch (error) {
      if (isUniqueViolation(error)) {
        slug = withRandomSuffix(baseSlug);
        continue;
      }
      console.error("create question failed", error);
      return NextResponse.json({ error: "Failed to create question." }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: "Couldn't generate a unique link — try a different title or custom slug." },
    { status: 500 }
  );
}
