export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card">
      <p className="text-[13.5px] font-medium text-ink-soft">{label}</p>
      <p className="mt-2 font-display text-[28px] font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-[12.5px] text-ink-soft">{hint}</p>}
    </div>
  );
}
