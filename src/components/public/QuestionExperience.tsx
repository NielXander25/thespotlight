import { SpotlightBeam } from "@/components/public/SpotlightBeam";
import { SubmissionForm } from "@/components/public/SubmissionForm";
import type { Question } from "@/lib/types";

export function QuestionExperience({ question }: { question: Question }) {
  return (
    <main className="grain relative min-h-screen overflow-hidden bg-stage">
      <SpotlightBeam />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-12 pt-10 sm:max-w-lg">
        <div className="flex items-center justify-center gap-2">
          <span className="h-2 w-2 animate-flicker rounded-full bg-brand-light" />
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-mist">
            The Spotlight
          </span>
        </div>

        <div className="mt-10 text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-brand-light">
            Reveal drops {question.reveal_label}
          </p>
          <h1 className="font-display text-[2.25rem] font-semibold leading-[1.08] tracking-tight text-beam sm:text-5xl">
            {question.title}
          </h1>
          {question.subtext && (
            <p className="mx-auto mt-4 max-w-[22rem] text-[15px] leading-relaxed text-mist">
              {question.subtext}
            </p>
          )}
        </div>

        <div className="relative mt-9">
          <SubmissionForm questionId={question.id} revealLabel={question.reveal_label} />
        </div>

        <footer className="mt-10 text-center text-[11px] text-mist/50">
          One guess, one card. We&rsquo;ll see who called it.
        </footer>
      </div>
    </main>
  );
}
