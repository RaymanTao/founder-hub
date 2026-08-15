export function Tag({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded-full border border-[rgba(138,106,82,0.12)] bg-[rgba(255,252,247,0.72)] px-3 py-1 text-xs font-medium text-[var(--secondary)]">
      {value}
    </span>
  );
}
