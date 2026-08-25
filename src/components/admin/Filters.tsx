"use client";

import { useAdminStore } from "@/lib/store";

export function Filters() {
  const filters = useAdminStore((s) => s.filters);
  const setFilters = useAdminStore((s) => s.setFilters);
  const departmentList = useAdminStore((s) => s.departmentList);
  const questionList = useAdminStore((s) => s.questionList);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <input
        type="text"
        placeholder="Search by name, department, or guess…"
        value={filters.search}
        onChange={(e) => setFilters({ search: e.target.value })}
        className="w-full rounded-xl border border-line bg-surface/70 px-4 py-2.5 text-sm text-beam placeholder:text-mist/50 focus:border-brand/60 sm:max-w-xs"
      />

      <select
        value={filters.questionId}
        onChange={(e) => setFilters({ questionId: e.target.value })}
        className="rounded-xl border border-line bg-surface/70 px-3 py-2.5 text-sm text-beam focus:border-brand/60"
      >
        <option value="all">All questions</option>
        <option value="none">Uncategorized</option>
        {questionList.map((q) => (
          <option key={q.id} value={q.id}>
            {q.title}
          </option>
        ))}
      </select>

      <select
        value={filters.department}
        onChange={(e) => setFilters({ department: e.target.value })}
        className="rounded-xl border border-line bg-surface/70 px-3 py-2.5 text-sm text-beam focus:border-brand/60"
      >
        <option value="all">All departments</option>
        {departmentList.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select
        value={filters.sort}
        onChange={(e) => setFilters({ sort: e.target.value as "newest" | "oldest" })}
        className="rounded-xl border border-line bg-surface/70 px-3 py-2.5 text-sm text-beam focus:border-brand/60"
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </select>

      <label className="flex items-center gap-2 text-sm text-mist">
        <input
          type="checkbox"
          checked={filters.includeHidden}
          onChange={(e) => setFilters({ includeHidden: e.target.checked })}
          className="h-4 w-4 rounded border-line accent-brand"
        />
        Show hidden
      </label>
    </div>
  );
}
