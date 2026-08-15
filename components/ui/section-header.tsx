export function SectionHeader({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8 max-w-3xl">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
        {eyebrow}
      </p>
      <h2 className="max-w-2xl font-display text-3xl leading-[0.98] text-[var(--foreground)] sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--secondary)] sm:text-base">
        {description}
      </p>
    </div>
  );
}
