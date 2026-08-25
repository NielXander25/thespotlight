"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAdminStore } from "@/lib/store";
import { SubmissionCard } from "@/components/admin/SubmissionCard";

export default function FeaturedPage() {
  const fetchSubmissions = useAdminStore((s) => s.fetchSubmissions);
  const setFilters = useAdminStore((s) => s.setFilters);
  const submissions = useAdminStore((s) => s.submissions);
  const loading = useAdminStore((s) => s.loading);
  const selectedForShare = useAdminStore((s) => s.selectedForShare);

  useEffect(() => {
    setFilters({ featuredOnly: true });
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const featured = submissions.filter((s) => s.featured);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-beam">Featured</h1>
          <p className="mt-1 text-sm text-mist">
            Pick the best guesses here, then select the ones you want in the share graphic.
          </p>
        </div>
        <Link
          href="/admin/share"
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
        >
          Create Share View{selectedForShare.length > 0 ? ` (${selectedForShare.length})` : ""}
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading && featured.length === 0 && (
          <p className="text-sm text-mist">Loading…</p>
        )}
        {!loading && featured.length === 0 && (
          <p className="text-sm text-mist">
            Nothing featured yet. Mark guesses as &ldquo;Featured&rdquo; from All Guesses.
          </p>
        )}
        {featured.map((s) => (
          <SubmissionCard key={s.id} submission={s} selectable />
        ))}
      </div>
    </div>
  );
}
