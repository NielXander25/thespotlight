import Link from "next/link";
import type { Post } from "@/lib/blog";
import { formatDate } from "@/lib/blog";

/** Editorial card for the blog index. `featured` renders the large lead layout.
    Covers are magazine-style portraits, shown uncropped at 3:4. */
export function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  const meta = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium uppercase tracking-[0.12em] text-mist">
      {post.category && <span className="text-brand">{post.category}</span>}
      <span>{formatDate(post.published_at)}</span>
      <span>·</span>
      <span>{post.reading_minutes} min read</span>
    </div>
  );

  const cover = (eager: boolean) =>
    post.cover_image ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={post.cover_image}
        alt={post.cover_alt || post.title}
        className="aspect-[3/4] w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
        loading={eager ? "eager" : "lazy"}
      />
    ) : (
      <div className="aspect-[3/4] w-full bg-stage" />
    );

  if (featured) {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group grid gap-8 md:grid-cols-[minmax(0,340px)_1fr] md:items-center"
      >
        <div className="overflow-hidden rounded-2xl border border-rule bg-white shadow-[0_30px_70px_-40px_rgba(20,22,40,.6)]">
          {cover(true)}
        </div>
        <div>
          <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
            Latest story
          </span>
          <h2 className="mt-4 font-serif text-3xl font-black leading-[1.06] tracking-tight text-ink sm:text-4xl group-hover:text-brand">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-ink/70">{post.excerpt}</p>
          )}
          <div className="mt-5">{meta}</div>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
            Read the story
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col">
      <div className="overflow-hidden rounded-xl border border-rule bg-white shadow-[0_18px_50px_-40px_rgba(20,22,40,.6)]">
        {cover(false)}
      </div>
      <div className="mt-4">
        {meta}
        <h3 className="mt-2 font-serif text-xl font-bold leading-snug text-ink group-hover:text-brand">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 text-[15px] leading-relaxed text-ink/65 line-clamp-2">{post.excerpt}</p>
        )}
      </div>
    </Link>
  );
}
