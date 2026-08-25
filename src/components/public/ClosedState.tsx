export function ClosedState({
  heading = "This link isn't live right now",
  body = "Check back once The Spotlight shares a new guessing link.",
}: {
  heading?: string;
  body?: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stage px-5">
      <div className="max-w-sm text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.28em] text-mist">
          The Spotlight
        </span>
        <h1 className="mt-3 font-display text-2xl font-semibold text-beam">{heading}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-mist">{body}</p>
      </div>
    </main>
  );
}
