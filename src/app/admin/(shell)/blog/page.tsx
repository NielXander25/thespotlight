"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Post } from "@/lib/blog";

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminBlogList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await fetch("/api/admin/posts", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setPosts((await res.json()).posts);
    } catch { setError(true); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function remove(id: string) {
    const prev = posts;
    setPosts((p) => p.filter((x) => x.id !== id));
    const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    if (!res.ok) setPosts(prev);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-beam">Blog</h1>
        <Link href="/admin/blog/editor" className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-light">
          New post
        </Link>
      </div>
      <p className="mt-1 text-sm text-mist">Write, add images, and publish stories. Published posts appear at <code className="rounded bg-surface2 px-1.5 py-0.5 text-xs">/blog</code> with full SEO.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line">
        {loading && <p className="p-5 text-sm text-mist">Loading…</p>}
        {error && <p className="p-5 text-sm text-red-300">Couldn&rsquo;t load posts. Has the posts table been created?</p>}
        {!loading && !error && posts.length === 0 && (
          <p className="p-5 text-sm text-mist">No posts yet. Create your first story.</p>
        )}
        {posts.map((p, i) => (
          <div key={p.id} className={`flex flex-wrap items-center gap-3 p-4 ${i ? "border-t border-line/60" : ""}`}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${p.status === "published" ? "bg-emerald-500/15 text-emerald-300" : "bg-surface2 text-mist"}`}>
                  {p.status}
                </span>
                {p.category && <span className="text-[11px] text-brand-light/80">{p.category}</span>}
              </div>
              <p className="mt-1 truncate font-medium text-beam">{p.title}</p>
              <p className="truncate text-xs text-mist">/blog/{p.slug} · {fmt(p.published_at)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {p.status === "published" && (
                <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="rounded-lg bg-surface2 px-3 py-1.5 text-xs font-medium text-beam hover:bg-surface2/70">View</a>
              )}
              <Link href={`/admin/blog/editor?id=${p.id}`} className="rounded-lg bg-surface2 px-3 py-1.5 text-xs font-medium text-beam hover:bg-brand/20">Edit</Link>
              <button onClick={() => { if (confirm("Delete this post? This cannot be undone.")) remove(p.id); }} className="rounded-lg px-3 py-1.5 text-xs font-medium text-mist hover:text-red-300">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
