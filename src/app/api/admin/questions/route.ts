import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { isReservedSlug, slugify, withRandomSuffix } from "@/lib/slug";
import type { QuestionInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getAdminClient();

  const { data: questions, error } = await supabase
    .from("questions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("list questions failed", error);
    return NextResponse.json({ error: "Failed to load questions." }, { status: 500 });
  }

  // Tally guess counts per question in one pass rather than N queries.
  const { data: allSubmissions } = await supabase.from("submissions").select("question_id");
  const counts = new Map<string, number>();
  for (const row of allSubmissions ?? []) {
    if (!row.question_id) continue;
    counts.set(row.question_id, (counts.get(row.question_id) ?? 0) + 1);
  }

  const withCounts = (questions ?? []).map((q) => ({
    ...q,
    guess_count: counts.get(q.id) ?? 0,
  }));

  return NextResponse.json({ questions: withCounts });
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

  const supabase = getAdminClient();

  // Try the clean slug first, then fall back to a suffixed version on
  // collision (Postgres unique_violation = 23505), a few times.
  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("questions")
      .insert({
        slug,
        title,
        subtext: subtext || null,
        reveal_label: revealLabel || "Monday",
      })
      .select()
      .single();

    if (!error) {
      return NextResponse.json({ question: { ...data, guess_count: 0 } }, { status: 201 });
    }
    if (error.code === "23505") {
      slug = withRandomSuffix(baseSlug);
      continue;
    }
    console.error("create question failed", error);
    return NextResponse.json({ error: "Failed to create question." }, { status: 500 });
  }

  return NextResponse.json(
    { error: "Couldn't generate a unique link — try a different title or custom slug." },
    { status: 500 }
  );
}
