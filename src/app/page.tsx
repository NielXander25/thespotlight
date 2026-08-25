import { SpotlightBeam } from "@/components/public/SpotlightBeam";
import { SubmissionForm } from "@/components/public/SubmissionForm";

const revealLabel = process.env.NEXT_PUBLIC_REVEAL_LABEL || "Monday";

export default function PublicPage() {
  return (
    <main className="grain relative min-h-screen overflow-hidden bg-stage">
      <SpotlightBeam />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-12 pt-10 sm:max-w-lg">
        {/* Brand mark */}
        <div className="flex items-center justify-center gap-2">
          <span className="h-2 w-2 animate-flicker rounded-full bg-brand-light" />
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-mist">
            The Spotlight
          </span>
        </div>

        {/* Hero */}
        <div className="mt-10 text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-brand-light">
            Reveal drops {revealLabel}
          </p>
          <h1 className="font-display text-[2.5rem] font-semibold leading-[1.05] tracking-tight text-beam sm:text-5xl">
            Who&rsquo;s in the
            <br />
            <span className="text-brand-light">Spotlight?</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[22rem] text-[15px] leading-relaxed text-mist">
            Think you know who&rsquo;s stepping into The Spotlight on {revealLabel}?
            Make your guess.
          </p>
        </div>

        {/* Form */}
        <div className="relative mt-9">
          <SubmissionForm />
        </div>

        <footer className="mt-10 text-center text-[11px] text-mist/50">
          One guess, one card. We&rsquo;ll see who called it.
        </footer>
      </div>
    </main>
  );
}
