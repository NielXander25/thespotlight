import Link from "next/link";
import { getAdminClient } from "@/lib/supabase";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { TalkToFounderButton } from "@/components/site/TalkToFounderButton";
import {
  AUDIENCE_FEELINGS,
  CRITERIA,
  DESKS,
  PROFILE_PARTS,
  RHYTHM,
  stories,
} from "@/content/site";

// Checks for a live guess per-request — never prerendered at build time.
export const dynamic = "force-dynamic";

/**
 * Returns the live guess only when exactly one question is active — the same
 * rule the old root redirect used, so the homepage never lists questions.
 */
async function getLiveGuess(): Promise<{ slug: string; title: string } | null> {
  try {
    const { data } = await getAdminClient()
      .from("questions")
      .select("slug, title")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(2);
    return data && data.length === 1 ? data[0] : null;
  } catch {
    // The homepage should still render if the database is unreachable.
    return null;
  }
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand">
      {children}
    </p>
  );
}

export default async function HomePage() {
  const liveGuess = await getLiveGuess();
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />

      <main>
        {/* Lead */}
        <section id="about" className="border-b border-rule">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <SectionLabel>The Spotlight · AFIT</SectionLabel>
              <h1 className="mt-4 font-serif text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
                You do not have to be famous to be worth knowing.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/75">
                The Spotlight discovers and amplifies remarkable people, ideas,
                achievements, and opportunities in our university community — and
                tells the story beneath them, so others can see what is possible.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <TalkToFounderButton />
                <Link
                  href="/founder?topic=recommend"
                  className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold hover:border-ink/50"
                >
                  Recommend someone
                </Link>
              </div>
            </div>

            <aside className="border-t border-rule pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              {liveGuess ? (
                <Link href={`/${liveGuess.slug}`} className="group block">
                  <SectionLabel>Live now</SectionLabel>
                  <p className="mt-3 font-serif text-2xl font-bold leading-snug group-hover:text-brand">
                    {liveGuess.title}
                  </p>
                  <p className="mt-2 text-sm text-ink/60">
                    Think you know who&rsquo;s next? Make your guess →
                  </p>
                </Link>
              ) : (
                <>
                  <SectionLabel>Our guiding belief</SectionLabel>
                  <p className="mt-3 font-serif text-3xl font-bold leading-tight">
                    Visibility can create possibility.
                  </p>
                </>
              )}
              <ul className="mt-8 space-y-4 border-t border-rule pt-6">
                {AUDIENCE_FEELINGS.map((f) => (
                  <li key={f.label}>
                    <p className="font-serif text-lg italic">&ldquo;{f.quote}&rdquo;</p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50">
                      {f.label}
                    </p>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        {/* Latest stories (renders only once real stories exist) */}
        {stories.length > 0 && (
          <section className="border-b border-rule">
            <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
              <SectionLabel>Latest</SectionLabel>
              <div className="mt-6 grid gap-8 md:grid-cols-3">
                {stories.slice(0, 6).map((story) => (
                  <Link key={story.href} href={story.href} className="group">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50">
                      {DESKS.find((d) => d.slug === story.desk)?.name} · {formatDate(story.publishedAt)}
                    </p>
                    <h3 className="mt-2 font-serif text-xl font-bold leading-snug group-hover:text-brand">
                      {story.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink/70">{story.dek}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Desks */}
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <SectionLabel>What we publish</SectionLabel>
                <h2 className="mt-3 font-serif text-3xl font-black sm:text-4xl">The desks</h2>
              </div>
              <p className="max-w-md text-sm text-ink/60">
                Broad in subject, focused in purpose: every piece should help you
                discover, understand, or act.
              </p>
            </div>
            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
              {DESKS.map((desk, i) => {
                const latest = stories.find((s) => s.desk === desk.slug);
                return (
                  <article id={desk.slug} key={desk.slug} className="scroll-mt-6 bg-paper p-6">
                    <p className="font-serif text-sm font-bold text-brand">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-3 font-serif text-xl font-bold leading-snug">{desk.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink/70">{desk.purpose}</p>
                    {latest ? (
                      <Link href={latest.href} className="mt-4 block text-sm font-semibold text-brand hover:underline">
                        {latest.title} →
                      </Link>
                    ) : (
                      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/40">
                        First stories soon
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Signature format */}
        <section id="profile" className="scroll-mt-6 bg-stage text-beam">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-light">
                Signature format · Fridays
              </p>
              <h2 className="mt-3 font-serif text-4xl font-black leading-tight">
                The Spotlight Profile
              </h2>
              <p className="mt-5 leading-relaxed text-mist">
                Not a résumé, and not simply a congratulatory post. We tell the story
                behind the person: where they started, what drives them, what they
                faced, what they built, and what others can learn.
              </p>
              <p className="mt-8 border-l-2 border-brand-light pl-4 font-serif text-lg italic text-beam/90">
                Person + Story + Achievement + Lesson + Possibility.
              </p>
            </div>
            <ol className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {PROFILE_PARTS.map((part, i) => (
                <li key={part.name} className="border-t border-line pt-4">
                  <p className="text-[11px] font-semibold text-brand-light">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-1 font-serif text-lg font-bold">{part.name}</p>
                  <p className="mt-1 text-sm text-mist">{part.question}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Rhythm + criteria */}
        <section id="rhythm" className="scroll-mt-6 border-b border-rule">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2">
            <div>
              <SectionLabel>Publishing rhythm</SectionLabel>
              <h2 className="mt-3 font-serif text-3xl font-black">Every week</h2>
              <dl className="mt-6 divide-y divide-rule border-y border-rule">
                {RHYTHM.map((r) => (
                  <div key={r.day} className="grid grid-cols-[7rem_1fr] gap-4 py-4">
                    <dt className="font-serif text-lg font-bold">{r.day}</dt>
                    <dd>
                      <p className="font-semibold">{r.focus}</p>
                      <p className="text-sm text-ink/60">{r.role}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <SectionLabel>Who we spotlight</SectionLabel>
              <h2 className="mt-3 font-serif text-3xl font-black">Substance over popularity</h2>
              <p className="mt-4 leading-relaxed text-ink/70">
                A quiet student doing meaningful work may be more suitable for The
                Spotlight than a popular student with nothing substantial to say. We
                look for:
              </p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {CRITERIA.map((c) => (
                  <li key={c} className="rounded-full border border-rule bg-white px-3.5 py-1.5 text-sm">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Founder + anonymous message */}
        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl bg-stage p-8 text-beam sm:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-light">
              Direct line
            </p>
            <h2 className="mt-3 font-serif text-3xl font-black leading-tight sm:text-4xl">
              Talk to the Founder.
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-mist">
              Recommend someone whose work deserves attention, pitch an idea, ask a
              question, or tell us what we should be covering. It goes straight to
              the founder.
            </p>
            <TalkToFounderButton className="mt-7" />
          </div>
          <div className="rounded-3xl border border-rule bg-white p-8 sm:p-10">
            <SectionLabel>Say it anonymously</SectionLabel>
            <h2 className="mt-3 font-serif text-2xl font-black leading-tight">
              Something on your mind?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/70">
              Send The Spotlight a message without your name. No sign-in, no
              identity collected.
            </p>
            <Link
              href="/message"
              className="mt-6 inline-flex rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold hover:border-ink/50"
            >
              Send an anonymous message
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
      <TalkToFounderButton variant="floating" className="md:hidden" />
    </div>
  );
}
