import { NextRequest, NextResponse } from "next/server";
import { getSql, isUniqueViolation } from "@/lib/db";
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

  if ("is_active" in update && typeof update.is_active !== "boolean") {
    return NextResponse.json({ error: "Invalid active value." }, { status: 400 });
  }
  if ("reveal_label" in update) {
    const revealLabel = String(update.reveal_label ?? "").trim();
    if (!revealLabel || revealLabel.length > 40) {
      return NextResponse.json({ error: "Reveal label should be 1-40 characters." }, { status: 422 });
    }
    update.reveal_label = revealLabel;
  }

  // Column names come only from ALLOWED_FIELDS; values are bound parameters.
  const fields = Object.keys(update) as AllowedField[];
  const assignments = fields.map((field, i) => `${field} = $${i + 1}`).join(", ");
  const values = [...fields.map((field) => update[field]), params.id];

  try {
    const [question] = await getSql().query(
      `update questions set ${assignments} where id::text = $${values.length} returning *`,
      values
    );
    if (!question) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }
    return NextResponse.json({ question });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ error: "That link is already in use." }, { status: 409 });
    }
    console.error("update question failed", error);
    return NextResponse.json({ error: "Failed to update question." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Guesses that already answered this question are kept — question_id just
  // becomes null on them (see schema's ON DELETE SET NULL) — deleting a
  // question never deletes anyone's guess.
  try {
    await getSql()`delete from questions where id::text = ${params.id}`;
  } catch (error) {
    console.error("delete question failed", error);
    return NextResponse.json({ error: "Failed to delete question." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
