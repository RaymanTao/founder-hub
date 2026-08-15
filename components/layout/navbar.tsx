"use client";

import { useState } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { navigation } from "@/data/site";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(250,246,239,0.82)] backdrop-blur-[10px]">
      <div className="mx-auto flex min-h-[72px] max-w-[1120px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-display text-[1.85rem] leading-none text-[var(--foreground)]"
        >
          Founder Hub
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-[var(--secondary)] transition hover:text-[var(--foreground)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <ButtonLink href="/contact">发起咨询</ButtonLink>
        </div>

        <button
          type="button"
          aria-label={open ? "关闭菜单" : "打开菜单"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.6)] md:hidden"
        >
          <span className="text-lg">{open ? "×" : "≡"}</span>
        </button>
      </div>

      {open ? (
        <div className="border-t border-[var(--border)] bg-[rgba(250,246,239,0.95)] md:hidden">
          <nav className="mx-auto flex max-w-[1120px] flex-col gap-2 px-4 py-4 sm:px-6">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--surface-alt)]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium !text-white hover:!text-white visited:!text-white"
            >
              发起咨询
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
