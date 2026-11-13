import { NextRequest, NextResponse } from "next/server";
import { getSql, isUniqueViolation } from "@/lib/db";
import { slugify, isReservedSlug } from "@/lib/slug";
import { readingMinutes } from "@/lib/blog";

export const dynamic = "force-dynamic";

function clean(v: unknown): string { return typeof v === "string" ? v.trim() : ""; }
function toTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((t) => String(t).trim()).filter(Boolean).slice(0, 12);
  if (typeof v === "string") return v.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 12);
  return [];
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [post] = await getSql()`select * from posts where id::text = ${params.id} limit 1`;
    if (!post) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ post });
  } catch (error) {
    console.error("get post failed", error);
    return NextResponse.json({ error: "Failed to load post." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const b = await req.json().catch(() => ({}));
  const sql = getSql();

  const [current] = await sql`select * from posts where id::text = ${params.id} limit 1`;
  if (!current) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const title = clean(b.title) || current.title;
  const body = typeof b.body === "string" ? b.body : current.body;
  const status = b.status === "published" || b.status === "draft" ? b.status : current.status;

  let slug = current.slug;
  if (typeof b.slug === "string" && clean(b.slug)) {
    const s = slugify(clean(b.slug));
    if (isReservedSlug(s)) return NextResponse.json({ error: "That link isn't available." }, { status: 422 });
    slug = s;
  }

  // Set published_at the first time a post goes live; keep it thereafter.
  let publishedAt = current.published_at;
  if (status === "published" && !current.published_at) publishedAt = new Date().toISOString();
  if (status === "draft") publishedAt = current.published_at; // keep original date if re-published

  const pick = (k: string, cur: unknown) => (k in b ? (clean(b[k]) || null) : cur);

  try {
    const [post] = await sql`
      update posts set
        slug = ${slug},
        title = ${title},
        excerpt = ${pick("excerpt", current.excerpt)},
        cover_image = ${pick("cover_image", current.cover_image)},
        cover_alt = ${pick("cover_alt", current.cover_alt)},
        body = ${body},
        category = ${pick("category", current.category)},
        author = ${clean(b.author) || current.author},
        tags = ${"tags" in b ? toTags(b.tags) : current.tags},
        status = ${status},
        meta_title = ${pick("meta_title", current.meta_title)},
        meta_description = ${pick("meta_description", current.meta_description)},
        og_image = ${pick("og_image", current.og_image)},
        reading_minutes = ${readingMinutes(body)},
        published_at = ${publishedAt},
        updated_at = now()
      where id::text = ${params.id}
      returning *`;
    return NextResponse.json({ post });
  } catch (error) {
    if (isUniqueViolation(error)) return NextResponse.json({ error: "That link is already in use." }, { status: 409 });
    console.error("update post failed", error);
    return NextResponse.json({ error: "Failed to update post." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await getSql()`delete from posts where id::text = ${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("delete post failed", error);
    return NextResponse.json({ error: "Failed to delete post." }, { status: 500 });
  }
}
