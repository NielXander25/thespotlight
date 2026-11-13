import { marked } from "marked";
import { getSql } from "@/lib/db";

/** Public base URL — used for canonical links, sitemap and social cards. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://thespotlightt.vercel.app"
).replace(/\/$/, "");

export type PostStatus = "draft" | "published";

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  cover_alt: string | null;
  body: string; // markdown
  category: string | null;
  author: string;
  tags: string[];
  status: PostStatus;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  reading_minutes: number;
  reactions: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

marked.use({ gfm: true, breaks: true });

/** Render admin-authored markdown to HTML. Authors are trusted (admin only). */
export function renderMarkdown(md: string): string {
  return marked.parse(md || "", { async: false }) as string;
}

/** Whole minutes to read, from a markdown body (~200 wpm, floor 1). */
export function readingMinutes(body: string): number {
  const words = (body || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Published posts, newest first, for the public index. */
export async function listPublished(category?: string): Promise<Post[]> {
  const sql = getSql();
  const rows =
    category && category !== "all"
      ? await sql`select * from posts
          where status = 'published' and published_at <= now() and category = ${category}
          order by published_at desc`
      : await sql`select * from posts
          where status = 'published' and published_at <= now()
          order by published_at desc`;
  return rows as Post[];
}

/** One published post by slug, or null. */
export async function getPublishedBySlug(slug: string): Promise<Post | null> {
  const [row] = await getSql()`
    select * from posts
    where slug = ${slug} and status = 'published' and published_at <= now()
    limit 1
  `;
  return (row as Post) ?? null;
}

/** Slugs + timestamps of every published post, for the sitemap. */
export async function publishedForSitemap(): Promise<
  { slug: string; updated_at: string }[]
> {
  const rows = await getSql()`
    select slug, updated_at from posts
    where status = 'published' and published_at <= now()
    order by published_at desc
  `;
  return rows as { slug: string; updated_at: string }[];
}

/** A few more published posts to show under an article (excludes current). */
export async function relatedPosts(slug: string, limit = 3): Promise<Post[]> {
  const rows = await getSql()`
    select * from posts
    where status = 'published' and published_at <= now() and slug <> ${slug}
    order by published_at desc
    limit ${limit}
  `;
  return rows as Post[];
}

/** Human date, e.g. "13 November 2026". */
export function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
