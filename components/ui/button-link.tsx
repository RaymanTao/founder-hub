import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--foreground)] !text-white hover:bg-[var(--accent)] hover:!text-white visited:!text-white focus-visible:outline-[var(--foreground)] shadow-[0_14px_34px_rgba(23,19,17,0.12)]",
  secondary:
    "border border-[var(--border)] bg-[rgba(255,255,255,0.72)] text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-[var(--accent)]",
  ghost:
    "bg-transparent text-[var(--foreground)] hover:text-[var(--accent)] focus-visible:outline-[var(--accent)]"
};

export function ButtonLink({
  href,
  children,
  variant = "primary"
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${variants[variant]}`}
    >
      {children}
    </Link>
  );
}
