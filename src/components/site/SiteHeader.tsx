import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { TalkToFounderButton } from "@/components/site/TalkToFounderButton";
import { DESKS } from "@/content/site";

function todayLabel() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
}

export function SiteHeader() {
  return (
    <header className="bg-stage text-beam">
      {/* Utility bar */}
      <div className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] text-mist sm:px-6">
          <span className="truncate">{todayLabel()}</span>
          <div className="flex items-center gap-5">
            <Link href="/message" className="hidden hover:text-beam sm:inline">
              Anonymous message
            </Link>
            <span className="hidden text-brand-light sm:inline">AFIT Edition</span>
          </div>
        </div>
      </div>

      {/* Masthead — the text mark leads; the logo mark is kept for the footer and favicon. */}
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-8 sm:flex-row sm:justify-between sm:px-6 sm:py-10">
        <Link href="/" aria-label="The Spotlight — home">
          <Wordmark size="md" tagline className="sm:items-start" />
        </Link>
        <TalkToFounderButton />
      </div>

      {/* Section nav */}
      <nav aria-label="Sections" className="border-y border-line bg-surface/40">
        <ul className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 py-3 text-[13px] font-medium text-mist sm:px-6">
          {DESKS.map((desk) => (
            <li key={desk.slug} className="shrink-0">
              <a href={`/#${desk.slug}`} className="hover:text-beam">
                {desk.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
