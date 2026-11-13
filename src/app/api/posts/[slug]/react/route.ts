import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { hashIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// A gentle per-IP cap so a script can't inflate counts, while still allowing
// many students behind one campus network to react. localStorage on the
// client prevents casual double-taps; this is a like counter, not a vote.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;
const hits = new Map<string, number[]>();
function tooFast(key: string): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > MAX_PER_WINDOW;
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const body = await req.json().catch(() => ({}));
  const action = body.action === "remove" ? "remove" : "add";

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (tooFast(`react:${hashIp(ip)}`)) {
    return NextResponse.json({ error: "Too fast — try again in a moment." }, { status: 429 });
  }

  const sql = getSql();
  try {
    const [post] = await sql`
      select id from posts
      where slug = ${params.slug} and status = 'published' and published_at <= now()
      limit 1`;
    if (!post) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const [row] =
      action === "add"
        ? await sql`update posts set reactions = reactions + 1 where id = ${post.id} returning reactions`
        : await sql`update posts set reactions = greatest(0, reactions - 1) where id = ${post.id} returning reactions`;
    return NextResponse.json({ count: row.reactions });
  } catch (error) {
    console.error("react failed", error);
    return NextResponse.json({ error: "Couldn't register that." }, { status: 500 });
  }
}
