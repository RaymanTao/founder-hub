export function Metric({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-soft)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(138,106,82,0.4)]">
      <div className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {value}
      </div>
    </div>
  );
}
