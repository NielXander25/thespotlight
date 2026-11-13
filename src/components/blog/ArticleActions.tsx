"use client";

import { useEffect, useState } from "react";

/** Like (clap) + share bar for an article. Anonymous, no accounts.
    The liked state is remembered per device in localStorage; the server
    keeps the total count. */
export function ArticleActions({
  slug,
  initialCount,
  url,
  title,
}: {
  slug: string;
  initialCount: number;
  url: string;
  title: string;
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  const key = `spotlight-liked:${slug}`;

  useEffect(() => {
    try {
      setLiked(localStorage.getItem(key) === "1");
    } catch {}
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, [key]);

  async function toggleLike() {
    if (busy) return;
    const next = !liked;
    // Optimistic
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    setBusy(true);
    try {
      localStorage.setItem(key, next ? "1" : "0");
    } catch {}
    try {
      const res = await fetch(`/api/posts/${slug}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: next ? "add" : "remove" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.count === "number") setCount(data.count);
      } else {
        // Roll back on failure
        setLiked(!next);
        setCount((c) => Math.max(0, c + (next ? -1 : 1)));
      }
    } catch {
      setLiked(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  }

  const shareText = `${title} — The Spotlight`;
  const enc = encodeURIComponent;
  const waHref = `https://wa.me/?text=${enc(`${shareText} ${url}`)}`;
  const xHref = `https://twitter.com/intent/tweet?text=${enc(shareText)}&url=${enc(url)}`;
  const liHref = `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: shareText, url });
    } catch {}
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rule bg-white px-5 py-4">
      <button
        onClick={toggleLike}
        aria-pressed={liked}
        className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
          liked ? "border-brand bg-brand/10 text-brand" : "border-rule text-ink/80 hover:border-ink/40"
        }`}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
        <span>{liked ? "Liked" : "Like"}</span>
        <span className="tabular-nums text-ink/50">{count}</span>
      </button>

      <div className="flex items-center gap-2">
        <span className="mr-1 hidden text-xs font-medium uppercase tracking-[0.14em] text-mist sm:inline">Share</span>
        {canNativeShare && (
          <button onClick={nativeShare} className={pill} aria-label="Share">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>
          </button>
        )}
        <a href={waHref} target="_blank" rel="noopener noreferrer" className={pill} aria-label="Share on WhatsApp">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20zm4.6-6c-.3-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.6.1a6.5 6.5 0 0 1-1.9-1.2 7.2 7.2 0 0 1-1.3-1.7c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5s0-.4 0-.5-.6-1.4-.8-2-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3A2.8 2.8 0 0 0 6 7.9a5 5 0 0 0 1 2.6 11.3 11.3 0 0 0 4.4 3.9c.6.3 1.1.4 1.5.5a3.5 3.5 0 0 0 1.6.1c.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.2-.2-.5-.3z"/></svg>
        </a>
        <a href={xHref} target="_blank" rel="noopener noreferrer" className={pill} aria-label="Share on X">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-7.3 8.3L23 22h-6.8l-5.3-6.9L4.8 22H1.7l7.8-8.9L1 2h7l4.8 6.3L18.9 2zm-2.4 18h1.9L7.6 4H5.6l10.9 16z"/></svg>
        </a>
        <a href={liHref} target="_blank" rel="noopener noreferrer" className={pill} aria-label="Share on LinkedIn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.1c.5-.9 1.8-1.9 3.6-1.9 3.9 0 4.6 2.5 4.6 5.8V21h-4v-5c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21H9z"/></svg>
        </a>
        <button onClick={copyLink} className={`${pill} ${copied ? "border-brand text-brand" : ""}`} aria-label="Copy link">
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/></svg>
          )}
        </button>
      </div>
    </div>
  );
}

const pill =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-rule text-ink/70 transition-colors hover:border-ink/40 hover:text-ink";
