import type { ReactNode } from "react";

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--secondary)]">
      {children}
    </span>
  );
}
