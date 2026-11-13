import { NextRequest, NextResponse } from "next/server";
import { getSql, isUniqueViolation } from "@/lib/db";
import { slugify, isReservedSlug, withRandomSuffix } from "@/lib/slug";
import { readingMinutes } from "@/lib/blog";

export const dynamic = "force-dynamic";

function clean(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function toTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((t) => String(t).trim()).filter(Boolean).slice(0, 12);
  if (typeof v === "string") return v.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 12);
  return [];
}

// GET — full list for the dashboard (drafts included), newest first.
export async function GET() {
  try {
    const rows = await getSql()`select * from posts order by coalesce(published_at, created_at) desc`;
    return NextResponse.json({ posts: rows });
  } catch (error) {
    console.error("list posts failed", error);
    return NextResponse.json({ error: "Failed to load posts." }, { status: 500 });
  }
}

// POST — create a post.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const title = clean(b.title);
  if (title.length < 1 || title.length > 160) {
    return NextResponse.json({ error: "Title is required (1–160 characters)." }, { status: 422 });
  }
  const status = b.status === "published" ? "published" : "draft";
  const body = typeof b.body === "string" ? b.body : "";
  const publishedAt = status === "published" ? new Date().toISOString() : null;

  let base = slugify(clean(b.slug) || title);
  if (isReservedSlug(base)) base = withRandomSuffix(base);

  const sql = getSql();
  let slug = base;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const [post] = await sql`
        insert into posts
          (slug, title, excerpt, cover_image, cover_alt, body, category, author, tags,
           status, meta_title, meta_description, og_image, reading_minutes, published_at)
        values
          (${slug}, ${title}, ${clean(b.excerpt) || null}, ${clean(b.cover_image) || null},
           ${clean(b.cover_alt) || null}, ${body}, ${clean(b.category) || null},
           ${clean(b.author) || "The Spotlight"}, ${toTags(b.tags)}, ${status},
           ${clean(b.meta_title) || null}, ${clean(b.meta_description) || null},
           ${clean(b.og_image) || null}, ${readingMinutes(body)}, ${publishedAt})
        returning *`;
      return NextResponse.json({ post }, { status: 201 });
    } catch (error) {
      if (isUniqueViolation(error)) { slug = withRandomSuffix(base); continue; }
      console.error("create post failed", error);
      return NextResponse.json({ error: "Failed to create post." }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "Couldn't generate a unique link — try a different title." }, { status: 500 });
}
