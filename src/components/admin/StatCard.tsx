export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface/60 px-5 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold text-beam">{value}</p>
    </div>
  );
}
