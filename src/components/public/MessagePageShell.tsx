import Link from "next/link";
import { SpotlightBeam } from "@/components/public/SpotlightBeam";
import { Wordmark } from "@/components/brand/Wordmark";

/** Dark, single-column layout shared by /founder and /message. */
export function MessagePageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grain relative min-h-screen overflow-hidden bg-stage">
      <SpotlightBeam />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-12 pt-10 sm:max-w-lg">
        <Link href="/" className="self-center" aria-label="The Spotlight — home">
          <Wordmark size="sm" tagline />
        </Link>

        <div className="mt-10 text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-brand-light">
            {eyebrow}
          </p>
          <h1 className="font-serif text-[2.25rem] font-black leading-[1.08] tracking-tight text-beam sm:text-5xl">
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-[24rem] text-[15px] leading-relaxed text-mist">
            {intro}
          </p>
        </div>

        <div className="relative mt-9">{children}</div>
      </div>
    </main>
  );
}
