"use client";

import { useState } from "react";
import { useAdminStore } from "@/lib/store";
import type { QuestionWithCount } from "@/lib/types";
import { TextArea, TextInput } from "@/components/ui/Field";

export function QuestionCard({ question }: { question: QuestionWithCount }) {
  const updateQuestion = useAdminStore((s) => s.updateQuestion);
  const deleteQuestion = useAdminStore((s) => s.deleteQuestion);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  const [title, setTitle] = useState(question.title);
  const [subtext, setSubtext] = useState(question.subtext ?? "");
  const [revealLabel, setRevealLabel] = useState(question.reveal_label);

  const link =
    typeof window !== "undefined" ? `${window.location.origin}/${question.slug}` : `/${question.slug}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleSave() {
    await updateQuestion(question.id, {
      title: title.trim(),
      subtext: subtext.trim(),
      revealLabel: revealLabel.trim() || "Monday",
    });
    setEditing(false);
  }

  return (
    <div
      className={`rounded-2xl border bg-surface/60 p-5 transition-colors ${
        question.is_active ? "border-line" : "border-line/50 opacity-70"
      }`}
    >
      {editing ? (
        <div className="space-y-3">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} />
          <TextArea
            value={subtext}
            onChange={(e) => setSubtext(e.target.value)}
            maxLength={240}
            rows={2}
            placeholder="Supporting text (optional)"
          />
          <TextInput
            value={revealLabel}
            onChange={(e) => setRevealLabel(e.target.value)}
            maxLength={40}
            placeholder="Reveal label, e.g. Monday"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-mist"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-display text-[15px] font-semibold text-beam">
                {question.title}
              </p>
              {question.subtext && (
                <p className="mt-1 line-clamp-2 text-xs text-mist">{question.subtext}</p>
              )}
            </div>
            <span className="shrink-0 rounded-full bg-brand/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-light">
              {question.guess_count} guess{question.guess_count === 1 ? "" : "es"}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface2 px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-xs text-mist">{link}</span>
            <button
              onClick={handleCopy}
              className="shrink-0 text-xs font-medium text-brand-light"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line/60 pt-3">
            <button
              onClick={() => updateQuestion(question.id, { is_active: !question.is_active })}
              className="rounded-lg bg-surface2 px-3 py-1.5 text-xs font-medium text-beam hover:bg-brand/20"
            >
              {question.is_active ? "Close guessing" : "Reopen"}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg bg-surface2 px-3 py-1.5 text-xs font-medium text-beam hover:bg-surface2/70"
            >
              Edit
            </button>

            {confirmingDelete ? (
              <>
                <button
                  onClick={() => deleteQuestion(question.id)}
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
        </>
      )}
    </div>
  );
}
