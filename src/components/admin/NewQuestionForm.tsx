"use client";

import { useState } from "react";
import { useAdminStore } from "@/lib/store";
import { slugify } from "@/lib/slug";
import { FieldWrapper, TextArea, TextInput } from "@/components/ui/Field";

export function NewQuestionForm({ onCreated }: { onCreated?: () => void }) {
  const createQuestion = useAdminStore((s) => s.createQuestion);
  const [title, setTitle] = useState("");
  const [subtext, setSubtext] = useState("");
  const [revealLabel, setRevealLabel] = useState("Monday");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const previewSlug = slug || slugify(title || "your-question");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (title.trim().length < 2) {
      setError("Give the question a title.");
      return;
    }
    setSubmitting(true);
    const result = await createQuestion({
      title: title.trim(),
      subtext: subtext.trim() || undefined,
      revealLabel: revealLabel.trim() || "Monday",
      slug: slug.trim() || undefined,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || "Failed to create question.");
      return;
    }
    setTitle("");
    setSubtext("");
    setRevealLabel("Monday");
    setSlug("");
    setSlugTouched(false);
    onCreated?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-line bg-surface/60 p-5"
    >
      <h2 className="font-display text-lg font-semibold text-beam">New question</h2>
      <p className="mt-1 text-sm text-mist">
        Each question gets its own link — share a different one per round so you know
        exactly which question every guess answered.
      </p>

      <div className="mt-4 space-y-4">
        <FieldWrapper label="Headline">
          <TextInput
            placeholder="Who's in the Spotlight — Week 3?"
            value={title}
            maxLength={140}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug("");
            }}
          />
        </FieldWrapper>

        <FieldWrapper label="Supporting text (optional)">
          <TextArea
            placeholder="Think you know who's stepping into the Spotlight this Friday?"
            value={subtext}
            maxLength={240}
            rows={2}
            onChange={(e) => setSubtext(e.target.value)}
          />
        </FieldWrapper>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrapper label="Reveal label">
            <TextInput
              placeholder="Monday"
              value={revealLabel}
              maxLength={40}
              onChange={(e) => setRevealLabel(e.target.value)}
            />
          </FieldWrapper>

          <FieldWrapper label="Link" hint={`${origin}/${previewSlug}`}>
            <TextInput
              placeholder={slugify(title || "your-question")}
              value={slug}
              maxLength={50}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
          </FieldWrapper>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {submitting ? "Creating…" : "Create question"}
      </button>
    </form>
  );
}
