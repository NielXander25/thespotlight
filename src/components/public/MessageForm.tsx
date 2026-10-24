"use client";

import { FormEvent, useState } from "react";
import { FieldWrapper, TextArea, TextInput } from "@/components/ui/Field";
import { MESSAGE_LIMITS, MESSAGE_RETENTION_DAYS } from "@/lib/messages";
import type { MessageChannel } from "@/lib/types";

type Phase = "form" | "submitting" | "success" | "error";

export function MessageForm({
  channel,
  placeholder,
}: {
  channel: MessageChannel;
  placeholder: string;
}) {
  const [phase, setPhase] = useState<Phase>("form");
  const [body, setBody] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderContact, setSenderContact] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");

  const isFounder = channel === "founder";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setErrorMessage("");

    if (body.trim().length < MESSAGE_LIMITS.body.min) {
      setErrors({ body: "Write a message first." });
      return;
    }

    setPhase("submitting");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, body, senderName, senderContact, honeypot }),
      });

      if (res.status === 429) {
        setErrorMessage("You're sending messages a little too fast — try again in a minute.");
        setPhase("error");
        return;
      }
      if (res.status === 422) {
        const resBody = await res.json();
        setErrors(resBody.fields ?? {});
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
        <h2 className="font-serif text-2xl font-bold text-beam">
          {isFounder ? "Your message is with the founder." : "Message received."}
        </h2>
        <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-mist">
          {isFounder && senderContact
            ? "Thanks for reaching out. If a reply is needed, we'll use the contact you left."
            : "Thanks for speaking up. Only The Spotlight team can read it."}
        </p>
        <button
          onClick={() => {
            setBody("");
            setSenderName("");
            setSenderContact("");
            setPhase("form");
          }}
          className="mt-7 text-sm font-medium text-brand-light underline-offset-4 hover:underline"
        >
          Send another message
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
        <FieldWrapper
          label="Your message"
          error={errors.body}
          hint={`${body.length}/${MESSAGE_LIMITS.body.max}`}
        >
          <TextArea
            placeholder={placeholder}
            value={body}
            maxLength={MESSAGE_LIMITS.body.max}
            rows={6}
            error={!!errors.body}
            onChange={(e) => setBody(e.target.value)}
          />
        </FieldWrapper>

        {isFounder && (
          <>
            <FieldWrapper label="Your name (optional)" error={errors.senderName}>
              <TextInput
                placeholder="Leave blank to stay anonymous"
                value={senderName}
                maxLength={MESSAGE_LIMITS.senderName.max}
                error={!!errors.senderName}
                onChange={(e) => setSenderName(e.target.value)}
                autoComplete="name"
              />
            </FieldWrapper>
            <FieldWrapper
              label="How can we reach you? (optional)"
              error={errors.senderContact}
              hint="Email, phone, or social handle — only if you want a reply."
            >
              <TextInput
                placeholder="e.g. you@example.com"
                value={senderContact}
                maxLength={MESSAGE_LIMITS.senderContact.max}
                error={!!errors.senderContact}
                onChange={(e) => setSenderContact(e.target.value)}
              />
            </FieldWrapper>
          </>
        )}
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
        {phase === "submitting"
          ? "Sending…"
          : isFounder
            ? "Send to the founder"
            : "Send anonymously"}
      </button>

      <p className="mt-4 text-center text-xs leading-relaxed text-mist/60">
        {isFounder
          ? "Only the founder can read this."
          : "We don't collect your name, account, or IP address with this message."}{" "}
        Messages are kept for {MESSAGE_RETENTION_DAYS} days, then permanently deleted.
      </p>
    </form>
  );
}
