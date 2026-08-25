"use client";

import { useEffect } from "react";
import { useAdminStore } from "@/lib/store";
import { Filters } from "@/components/admin/Filters";
import { SubmissionCard } from "@/components/admin/SubmissionCard";

export default function GuessesPage() {
  const fetchSubmissions = useAdminStore((s) => s.fetchSubmissions);
  const submissions = useAdminStore((s) => s.submissions);
  const loading = useAdminStore((s) => s.loading);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-beam">All Guesses</h1>
        <a
          href="/api/admin/export"
          className="rounded-xl border border-line bg-surface/60 px-4 py-2 text-sm font-medium text-beam hover:bg-surface2"
        >
          Export CSV
        </a>
      </div>

      <div className="mt-5">
        <Filters />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading && submissions.length === 0 && (
          <p className="text-sm text-mist">Loading submissions…</p>
        )}
        {!loading && submissions.length === 0 && (
          <p className="text-sm text-mist">No guesses match your filters.</p>
        )}
        {submissions.map((s) => (
          <SubmissionCard key={s.id} submission={s} />
        ))}
      </div>
    </div>
  );
}
