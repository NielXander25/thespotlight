"use client";

import { FormEvent, useState } from "react";
import { FieldWrapper, TextArea, TextInput } from "@/components/ui/Field";

const MESSAGE_MAX = 600;

type Phase = "form" | "submitting" | "success" | "error";

export function SubmissionForm({
  questionId,
  revealLabel,
}: {
  questionId: string;
  revealLabel: string;
}) {
  const [phase, setPhase] = useState<Phase>("form");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setErrorMessage("");

    const fieldErrors: Record<string, string> = {};
    if (name.trim().length < 2) fieldErrors.name = "Enter your full name.";
    if (department.trim().length < 2) fieldErrors.department = "Enter your department.";
    if (message.trim().length < 5) fieldErrors.message = "Tell us who you think it is.";
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setPhase("submitting");
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, name, department, message, honeypot }),
      });

      if (res.status === 429) {
        setErrorMessage("You're guessing a little too fast — try again in a minute.");
        setPhase("error");
        return;
      }
      if (res.status === 403 || res.status === 404) {
        const body = await res.json().catch(() => ({}));
        setErrorMessage(body.error || "This guess isn't open anymore.");
        setPhase("error");
        return;
      }
      if (res.status === 422) {
        const body = await res.json();
        setErrors(body.fields ?? {});
        setPhase("form");
        return;
      }
      if (!res.ok) {
        throw new Error("request failed");
      }
      setPhase("success");
    } catch {
      setErrorMessage("Something went wrong. Check your connection and try again.");
      setPhase("error");
    }
  }

  if (phase === "success") {
    return (
      <div className="animate-pop rounded-3xl border border-line bg-surface/70 p-8 text-center shadow-card sm:p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand/15 text-2xl">
          👀
        </div>
        <h2 className="font-display text-2xl font-semibold text-beam">
          Your guess has been received.
        </h2>
        <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-mist">
          Let&rsquo;s see if you&rsquo;re right on {revealLabel}. Keep an eye on The Spotlight.
        </p>
        <button
          onClick={() => {
            setName("");
            setDepartment("");
            setMessage("");
            setPhase("form");
          }}
          className="mt-7 text-sm font-medium text-brand-light underline-offset-4 hover:underline"
        >
          Submit another guess
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-rise rounded-3xl border border-line bg-surface/70 p-6 shadow-card backdrop-blur-sm sm:p-8"
      noValidate
    >
      {/* Honeypot — hidden from real users, catches naive bots */}
      <div className="absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="space-y-5">
        <FieldWrapper label="Full name" error={errors.name}>
          <TextInput
            placeholder="e.g. Amaka Chidi"
            value={name}
            maxLength={80}
            error={!!errors.name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </FieldWrapper>

        <FieldWrapper label="Department" error={errors.department}>
          <TextInput
            placeholder="e.g. Computer Engineering, 300L"
            value={department}
            maxLength={60}
            error={!!errors.department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </FieldWrapper>

        <FieldWrapper
          label="Your guess"
          error={errors.message}
          hint={`${message.length}/${MESSAGE_MAX}`}
        >
          <TextArea
            placeholder="I think it's John from Computer Science because..."
            value={message}
            maxLength={MESSAGE_MAX}
            rows={4}
            error={!!errors.message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </FieldWrapper>
      </div>

      {phase === "error" && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={phase === "submitting"}
        className="mt-7 w-full rounded-xl bg-brand py-4 text-[15px] font-semibold text-white shadow-[0_8px_30px_-8px_rgba(61,99,245,0.7)] transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {phase === "submitting" ? "Sending your guess…" : "Make your guess"}
      </button>

      <p className="mt-4 text-center text-xs leading-relaxed text-mist/60">
        Your name stays with The Spotlight team only. Guesses are shown publicly
        without your identity, unless we ask to feature you.
      </p>
    </form>
  );
}
