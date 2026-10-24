/**
 * The Spotlight text mark — the primary brand signature.
 * The logo mark (public/brand/logo-mark.png) is used sparingly: favicon,
 * footer, and social images. Everywhere else, use this.
 */
export function Wordmark({
  tone = "dark",
  size = "md",
  tagline = false,
  className = "",
}: {
  /** "dark" = on a navy background, "light" = on a paper background. */
  tone?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  tagline?: boolean;
  className?: string;
}) {
  const main = tone === "dark" ? "text-beam" : "text-ink";
  const accent = tone === "dark" ? "text-brand-light" : "text-brand";
  const sizes = {
    sm: { word: "text-xl", tag: "text-[8px] tracking-[0.42em]" },
    md: { word: "text-3xl", tag: "text-[9px] tracking-[0.48em]" },
    lg: { word: "text-5xl sm:text-7xl", tag: "text-[10px] sm:text-xs tracking-[0.55em]" },
  }[size];

  return (
    <span className={`inline-flex flex-col items-center leading-none ${className}`}>
      <span
        className={`font-serif font-black uppercase tracking-[0.02em] ${sizes.word} ${main}`}
      >
        <span className={accent}>The</span> Spotlight
      </span>
      {tagline && (
        <span className={`mt-2 font-body font-semibold uppercase ${sizes.tag} ${main}`}>
          Stories worth <span className={accent}>seeing.</span>
        </span>
      )}
    </span>
  );
}
