"use client";

import { useState } from "react";
import type { Submission } from "@/lib/types";
import { useAdminStore } from "@/lib/store";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SubmissionCard({
  submission,
  selectable = false,
}: {
  submission: Submission;
  selectable?: boolean;
}) {
  const updateSubmission = useAdminStore((s) => s.updateSubmission);
  const deleteSubmission = useAdminStore((s) => s.deleteSubmission);
  const selected = useAdminStore((s) => s.selectedForShare.includes(submission.id));
  const toggleShareSelection = useAdminStore((s) => s.toggleShareSelection);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(
      `${submission.name} — ${submission.department}\n"${submission.message}"`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const isHidden = submission.status === "hidden";

  return (
    <div
      className={`rounded-2xl border bg-surface/60 p-5 transition-colors ${
        isHidden ? "border-line/50 opacity-60" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] font-semibold text-beam">
            {submission.name}
          </p>
          <p className="text-xs text-mist">{submission.department}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {submission.featured && (
            <span className="rounded-full bg-brand/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-light">
              Featured
            </span>
          )}
          {selectable && (
            <label className="flex items-center gap-1.5 text-[11px] text-mist">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggleShareSelection(submission.id)}
                className="h-4 w-4 rounded border-line accent-brand"
              />
              Select
            </label>
          )}
        </div>
      </div>

      <p className="mt-3 text-[14px] leading-relaxed text-beam/90">
        {submission.message}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[11px] text-mist/70">{formatDate(submission.created_at)}</span>
        {isHidden && (
          <span className="text-[11px] font-medium text-red-300">Hidden</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-line/60 pt-3">
        <button
          onClick={() => updateSubmission(submission.id, { featured: !submission.featured })}
          className="rounded-lg bg-surface2 px-3 py-1.5 text-xs font-medium text-beam transition-colors hover:bg-brand/20"
        >
          {submission.featured ? "Unfeature" : "Feature"}
        </button>
        <button
          onClick={() =>
            updateSubmission(submission.id, {
              status: isHidden ? "visible" : "hidden",
            })
          }
          className="rounded-lg bg-surface2 px-3 py-1.5 text-xs font-medium text-beam transition-colors hover:bg-surface2/70"
        >
          {isHidden ? "Unhide" : "Hide"}
        </button>
        <button
          onClick={handleCopy}
          className="rounded-lg bg-surface2 px-3 py-1.5 text-xs font-medium text-beam transition-colors hover:bg-surface2/70"
        >
          {copied ? "Copied" : "Copy"}
        </button>

        {confirmingDelete ? (
          <>
            <button
              onClick={() => deleteSubmission(submission.id)}
              className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300"
            >
              Confirm delete
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-mist"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="ml-auto rounded-lg px-3 py-1.5 text-xs font-medium text-mist hover:text-red-300"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
