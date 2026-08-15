import type { ReactNode } from "react";

export function Card({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] backdrop-blur-[6px] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(138,106,82,0.32)] hover:shadow-[0_22px_54px_rgba(23,19,17,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}
