import Link from "next/link";

/** The "Talk To The Founder" call to action, used in the header, page body, and as a floating pill. */
export function TalkToFounderButton({
  variant = "solid",
  className = "",
}: {
  variant?: "solid" | "outline" | "floating";
  className?: string;
}) {
  const styles = {
    solid:
      "rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(61,99,245,0.7)] hover:bg-brand-light",
    outline:
      "rounded-full border border-beam/30 px-5 py-2.5 text-sm font-semibold text-beam hover:border-beam/60 hover:bg-beam/5",
    floating:
      "fixed bottom-5 right-5 z-40 rounded-full bg-brand px-5 py-3.5 text-sm font-semibold text-white shadow-[0_12px_40px_-8px_rgba(61,99,245,0.8)] hover:bg-brand-light sm:bottom-8 sm:right-8",
  }[variant];

  return (
    <Link
      href="/founder"
      className={`inline-flex items-center gap-2 whitespace-nowrap transition-colors ${styles} ${className}`}
    >
      <span className="h-2 w-2 animate-flicker rounded-full bg-white/90" aria-hidden />
      Talk To The Founder
    </Link>
  );
}
