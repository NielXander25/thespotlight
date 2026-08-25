export function SpotlightBeam() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center overflow-hidden"
    >
      <div className="spotlight-beam animate-flicker" />
      <div className="beam-cone opacity-70" />
    </div>
  );
}
