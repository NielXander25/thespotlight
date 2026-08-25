"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAdminStore } from "@/lib/store";
import { StatCard } from "@/components/admin/StatCard";
import { SubmissionCard } from "@/components/admin/SubmissionCard";

export default function DashboardPage() {
  const fetchSubmissions = useAdminStore((s) => s.fetchSubmissions);
  const fetchQuestions = useAdminStore((s) => s.fetchQuestions);
  const submissions = useAdminStore((s) => s.submissions);
  const stats = useAdminStore((s) => s.stats);
  const questions = useAdminStore((s) => s.questions);
  const loading = useAdminStore((s) => s.loading);

  useEffect(() => {
    fetchSubmissions();
    fetchQuestions();
  }, [fetchSubmissions, fetchQuestions]);

  const activeQuestions = questions.filter((q) => q.is_active).length;

  const recent = submissions.slice(0, 6);

  return (
    <div>
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-mist">
          The Spotlight
        </span>
        <h1 className="mt-1 font-display text-3xl font-semibold text-beam">
          Admin Dashboard
        </h1>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total guesses" value={stats.total} />
        <StatCard label="Departments" value={stats.departments} />
        <StatCard label="Today" value={stats.today} />
        <StatCard label="Active questions" value={activeQuestions} />
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-line bg-surface/40 px-5 py-3">
        <p className="text-sm text-mist">Need a new link for the next round?</p>
        <Link href="/admin/questions" className="text-sm font-medium text-brand-light">
          Manage questions →
        </Link>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-beam">Recent guesses</h2>
        <Link href="/admin/guesses" className="text-sm font-medium text-brand-light">
          View all →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading && recent.length === 0 && (
          <p className="text-sm text-mist">Loading submissions…</p>
        )}
        {!loading && recent.length === 0 && (
          <p className="text-sm text-mist">
            No guesses yet — once the link goes out, submissions will appear here.
          </p>
        )}
        {recent.map((s) => (
          <SubmissionCard key={s.id} submission={s} />
        ))}
      </div>
    </div>
  );
}
