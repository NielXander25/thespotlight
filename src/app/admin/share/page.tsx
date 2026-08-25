"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAdminStore } from "@/lib/store";
import { ShareCard } from "@/components/admin/ShareCard";

export default function SharePage() {
  const fetchSubmissions = useAdminStore((s) => s.fetchSubmissions);
  const setFilters = useAdminStore((s) => s.setFilters);
  const submissions = useAdminStore((s) => s.submissions);
  const selectedForShare = useAdminStore((s) => s.selectedForShare);
  const toggleShareSelection = useAdminStore((s) => s.toggleShareSelection);
  const updateSubmission = useAdminStore((s) => s.updateSubmission);

  const [presentationMode, setPresentationMode] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFilters({ featuredOnly: true });
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const featured = submissions.filter((s) => s.featured);
  const selected = featured.filter((s) => selectedForShare.includes(s.id));

  async function handleDownload() {
    if (!posterRef.current) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(posterRef.current, {
        pixelRatio: 2,
        backgroundColor: "#090E22",
      });
      const link = document.createElement("a");
      link.download = `the-spotlight-guesses-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stage">
      {!presentationMode && (
        <div className="border-b border-line/70 bg-surface/40 px-5 py-4">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Link href="/admin/featured" className="text-sm text-mist hover:text-beam">
                ← Back
              </Link>
              <h1 className="font-display text-lg font-semibold text-beam">Share View</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={selected.length === 0 || downloading}
                className="rounded-xl border border-line bg-surface2 px-4 py-2 text-sm font-medium text-beam disabled:opacity-40"
              >
                {downloading ? "Preparing…" : "Download PNG"}
              </button>
              <button
                onClick={() => setPresentationMode(true)}
                disabled={selected.length === 0}
                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                Enter presentation mode
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-5 py-8">
        {!presentationMode && (
          <div className="mb-8">
            <h2 className="font-medium text-beam">Choose guesses for this graphic</h2>
            <p className="mt-1 text-sm text-mist">
              Only featured guesses show up here. Toggle &ldquo;Reveal identity&rdquo; to show a
              submitter&rsquo;s real name on the poster — otherwise they stay anonymous.
            </p>

            {featured.length === 0 ? (
              <p className="mt-4 text-sm text-mist">
                Nothing featured yet. Go to{" "}
                <Link href="/admin/featured" className="text-brand-light underline">
                  Featured
                </Link>{" "}
                and mark a few guesses first.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {featured.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-start gap-3 rounded-xl border border-line bg-surface/60 p-3"
                  >
                    <input
                      type="checkbox"
                      checked={selectedForShare.includes(s.id)}
                      onChange={() => toggleShareSelection(s.id)}
                      className="mt-1 h-4 w-4 rounded border-line accent-brand"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-beam">
                        {s.name} <span className="text-mist">— {s.department}</span>
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-mist">{s.message}</p>
                      <label className="mt-2 flex items-center gap-1.5 text-[11px] text-mist">
                        <input
                          type="checkbox"
                          checked={s.identity_revealed}
                          onChange={() =>
                            updateSubmission(s.id, { identity_revealed: !s.identity_revealed })
                          }
                          className="h-3.5 w-3.5 rounded border-line accent-brand"
                        />
                        Reveal identity on poster
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* The poster itself — this is what gets screenshotted / downloaded */}
        <div
          ref={posterRef}
          className="grain relative overflow-hidden rounded-3xl border border-line bg-stage p-6 sm:p-10"
        >
          <div
            aria-hidden
            className="spotlight-beam pointer-events-none absolute left-1/2 top-[-15%] -translate-x-1/2"
          />
          <div className="relative text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-mist">
              The Spotlight
            </span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-beam sm:text-4xl">
              The guesses are in 👀
            </h2>
          </div>

          {selected.length === 0 ? (
            <p className="relative mt-8 text-center text-sm text-mist">
              Select at least one featured guess above to build the graphic.
            </p>
          ) : (
            <div className="relative mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {selected.map((s) => (
                <ShareCard key={s.id} submission={s} />
              ))}
            </div>
          )}

          <p className="relative mt-8 text-center text-[11px] text-mist/60">
            Think you know who&rsquo;s next? Drop your guess before Monday.
          </p>
        </div>

        {presentationMode && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setPresentationMode(false)}
              className="rounded-xl border border-line bg-surface2 px-4 py-2 text-sm font-medium text-beam"
            >
              Exit presentation mode
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
