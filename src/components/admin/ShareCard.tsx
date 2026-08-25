import type { Submission } from "@/lib/types";

export function ShareCard({ submission }: { submission: Submission }) {
  const identity = submission.identity_revealed
    ? `${submission.name.toUpperCase()} — ${submission.department}`
    : "ANONYMOUS GUESS";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-surface to-surface2 p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-brand/25 blur-3xl"
      />
      <p className="relative font-display text-3xl leading-none text-brand-light/70">
        &ldquo;
      </p>
      <p className="relative mt-1 text-[17px] font-medium leading-relaxed text-beam">
        {submission.message}
      </p>
      <div className="relative mt-5 border-t border-line/70 pt-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-light">
          {identity}
        </p>
      </div>
    </div>
  );
}
