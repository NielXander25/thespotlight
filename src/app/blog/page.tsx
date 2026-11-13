import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PostCard } from "@/components/blog/PostCard";
import { listPublished, SITE_URL, type Post } from "@/lib/blog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stories — The Spotlight",
  description:
    "Stories worth seeing from AFIT: remarkable people, projects, ideas and journeys, discovered and told by The Spotlight.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: "Stories — The Spotlight",
    description:
      "Stories worth seeing from AFIT: remarkable people, projects, ideas and journeys.",
    url: `${SITE_URL}/blog`,
    type: "website",
    images: ["/brand/logo-mark.png"],
  },
};

export default async function BlogIndex({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const category = searchParams.category;
  let posts: Post[] = [];
  let loadError = false;
  try {
    posts = await listPublished(category);
  } catch {
    loadError = true;
  }

  const [lead, ...rest] = posts;
  // Category chips reflect the categories actually used by published posts.
  let categories: string[] = [];
  try {
    const all = category ? await listPublished() : posts;
    categories = Array.from(
      new Set(all.map((p) => p.category).filter((c): c is string => !!c))
    ).sort();
  } catch {
    categories = [];
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <main>
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand">
              The Spotlight · Stories
            </p>
            <h1 className="mt-4 max-w-3xl font-serif text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              Stories worth seeing.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/70">
              Remarkable people, projects, ideas and journeys from AFIT — discovered, told with
              care, and brought into view.
            </p>

            {categories.length > 0 && (
              <nav className="mt-8 flex flex-wrap gap-2" aria-label="Categories">
                <Link
                  href="/blog"
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    !category ? "border-ink bg-ink text-paper" : "border-rule text-ink/70 hover:border-ink/40"
                  }`}
                >
                  All
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c}
                    href={`/blog?category=${encodeURIComponent(c)}`}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      category === c ? "border-ink bg-ink text-paper" : "border-rule text-ink/70 hover:border-ink/40"
                    }`}
                  >
                    {c}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </section>

        {loadError ? (
          <div className="mx-auto max-w-6xl px-4 py-24 text-center text-mist sm:px-6">
            Couldn&rsquo;t load stories right now. Please try again shortly.
          </div>
        ) : posts.length === 0 ? (
          <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
            <p className="font-serif text-2xl font-bold">The first stories are coming soon.</p>
            <p className="mt-3 text-ink/60">Check back shortly — or recommend someone worth featuring.</p>
            <Link href="/founder?topic=recommend" className="mt-6 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white">
              Recommend someone
            </Link>
          </div>
        ) : (
          <>
            {lead && (
              <section className="border-b border-rule">
                <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
                  <PostCard post={lead} featured />
                </div>
              </section>
            )}
            {rest.length > 0 && (
              <section>
                <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
                  <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                    {rest.map((p) => (
                      <PostCard key={p.id} post={p} />
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
