import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { isReservedSlug, slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

const ALLOWED_FIELDS = ["title", "subtext", "reveal_label", "is_active", "slug"] as const;
type AllowedField = (typeof ALLOWED_FIELDS)[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  const update: Partial<Record<AllowedField, unknown>> = {};

  for (const field of ALLOWED_FIELDS) {
    if (field in body) update[field] = body[field];
  }

  if ("title" in update) {
    const title = String(update.title ?? "").trim();
    if (title.length < 2 || title.length > 140) {
      return NextResponse.json({ error: "Title should be 2-140 characters." }, { status: 422 });
    }
    update.title = title;
  }
  if ("subtext" in update) {
    const subtext = String(update.subtext ?? "").trim();
    if (subtext.length > 240) {
      return NextResponse.json({ error: "Supporting text is too long." }, { status: 422 });
    }
    update.subtext = subtext || null;
  }
  if ("slug" in update) {
    const slug = slugify(String(update.slug ?? ""));
    if (isReservedSlug(slug)) {
      return NextResponse.json({ error: "That link isn't available." }, { status: 422 });
    }
    update.slug = slug;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("questions")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "That link is already in use." }, { status: 409 });
    }
    console.error("update question failed", error);
    return NextResponse.json({ error: "Failed to update question." }, { status: 500 });
  }

  return NextResponse.json({ question: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getAdminClient();

  // Guesses that already answered this question are kept — question_id just
  // becomes null on them (see schema's ON DELETE SET NULL) — deleting a
  // question never deletes anyone's guess.
  const { error } = await supabase.from("questions").delete().eq("id", params.id);

  if (error) {
    console.error("delete question failed", error);
    return NextResponse.json({ error: "Failed to delete question." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
