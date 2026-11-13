import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PostCard } from "@/components/blog/PostCard";
import {
  getPublishedBySlug,
  relatedPosts,
  renderMarkdown,
  formatDate,
  SITE_URL,
} from "@/lib/blog";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPublishedBySlug(params.slug).catch(() => null);
  if (!post) return { title: "Story not found" };

  const url = `${SITE_URL}/blog/${post.slug}`;
  const title = post.meta_title || post.title;
  const description =
    post.meta_description || post.excerpt || "A story worth seeing from The Spotlight.";
  const image = post.og_image || post.cover_image || "/brand/logo-mark.png";

  return {
    title,
    description,
    alternates: { canonical: url },
    authors: [{ name: post.author }],
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "The Spotlight",
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at,
      authors: [post.author],
      tags: post.tags,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const post = await getPublishedBySlug(params.slug).catch(() => null);
  if (!post) notFound();

  const related = await relatedPosts(post.slug).catch(() => []);
  const url = `${SITE_URL}/blog/${post.slug}`;
  const rawImage = post.og_image || post.cover_image;
  const image = rawImage
    ? rawImage.startsWith("http")
      ? rawImage
      : `${SITE_URL}${rawImage.startsWith("/") ? "" : "/"}${rawImage}`
    : `${SITE_URL}/brand/logo-mark.png`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description || post.excerpt || undefined,
    image: [image],
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "The Spotlight",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/logo-mark.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: post.category || undefined,
    keywords: post.tags.join(", ") || undefined,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Stories", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <main>
        <article>
          <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6 sm:pt-14">
            <nav className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-mist" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-ink">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-ink">Stories</Link>
            </nav>

            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-medium uppercase tracking-[0.12em] text-mist">
              {post.category && (
                <Link href={`/blog?category=${encodeURIComponent(post.category)}`} className="text-brand">
                  {post.category}
                </Link>
              )}
              <span>{formatDate(post.published_at)}</span>
              <span>·</span>
              <span>{post.reading_minutes} min read</span>
            </div>

            <h1 className="mt-4 font-serif text-4xl font-black leading-[1.07] tracking-tight sm:text-5xl">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-5 text-xl leading-relaxed text-ink/70 font-serif">{post.excerpt}</p>
            )}
            <div className="mt-6 flex items-center gap-3 border-y border-rule py-4 text-sm text-ink/70">
              <span className="font-semibold text-ink">{post.author}</span>
            </div>
          </div>

          {post.cover_image && (
            <figure className="mx-auto mt-8 max-w-sm px-4 sm:px-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.cover_image}
                alt={post.cover_alt || post.title}
                className="w-full rounded-2xl border border-rule object-cover shadow-[0_40px_90px_-50px_rgba(20,22,40,.7)]"
                loading="eager"
              />
              {post.cover_alt && (
                <figcaption className="mt-3 text-center text-[13px] text-mist">{post.cover_alt}</figcaption>
              )}
            </figure>
          )}

          <div
            className="prose mx-auto mt-10 max-w-3xl px-4 pb-4 sm:px-6"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
          />

          {post.tags.length > 0 && (
            <div className="mx-auto max-w-3xl px-4 pb-4 sm:px-6">
              <div className="flex flex-wrap gap-2 border-t border-rule pt-6">
                {post.tags.map((t) => (
                  <span key={t} className="rounded-full border border-rule px-3 py-1 text-xs text-ink/60">#{t}</span>
                ))}
              </div>
            </div>
          )}

          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
            <div className="rounded-2xl bg-stage p-7 text-beam sm:p-9">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-light">The Spotlight</p>
              <p className="mt-2 font-serif text-2xl font-bold leading-snug">Know someone whose work deserves to be seen?</p>
              <Link href="/founder?topic=recommend" className="mt-5 inline-flex rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-light">
                Recommend someone
              </Link>
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <section className="border-t border-rule">
            <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
              <h2 className="font-serif text-2xl font-bold">More stories</h2>
              <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
