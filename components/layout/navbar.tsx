"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { navigation } from "@/data/site";
import { SearchOverlay } from "@/components/search/search-overlay";
import { AuthOverlay } from "@/components/auth/auth-overlay";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [readerEmail, setReaderEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ display_name: string; avatar_url: string | null } | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname.startsWith("/writing/");
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data: { email: string | null; profile?: { display_name: string; avatar_url: string | null } | null }) => { setReaderEmail(data.email); setProfile(data.profile ?? null); })
      .catch(() => setReaderEmail(null));

    const onAuthChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ email?: string; profile?: { display_name: string; avatar_url: string | null } | null }>).detail;
      setReaderEmail(detail.email ?? null);
      setProfile(detail.profile ?? null);
      fetch("/api/auth/me")
        .then((response) => response.json())
        .then((data: { email: string | null; profile?: { display_name: string; avatar_url: string | null } | null }) => {
          if (data.email) setProfile(data.profile ?? null);
        })
        .catch(() => undefined);
    };
    window.addEventListener("founder-hub-auth-changed", onAuthChanged);
    const onProfileChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ avatarUrl?: string }>).detail ?? {};
      if (detail.avatarUrl) {
        setProfile((current) => ({ display_name: current?.display_name || "Founder", avatar_url: detail.avatarUrl || null }));
      }
      fetch("/api/auth/me")
        .then((response) => response.json())
        .then((data: { email: string | null; profile?: { display_name: string; avatar_url: string | null } | null }) => {
          if (data.email) {
            setReaderEmail(data.email);
            setProfile(data.profile ?? null);
          }
        })
        .catch(() => undefined);
    };
    window.addEventListener("founder-hub-profile-changed", onProfileChanged);
    return () => {
      window.removeEventListener("founder-hub-auth-changed", onAuthChanged);
      window.removeEventListener("founder-hub-profile-changed", onProfileChanged);
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setReaderEmail(null);
    setProfile(null);
    setAccountOpen(false);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(250,246,239,0.82)] backdrop-blur-[10px]">
      <div className="mx-auto flex min-h-[72px] max-w-[1120px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-display text-[1.85rem] leading-none text-[var(--foreground)]"
        >
          Founder Hub
        </Link>

        <nav className="hidden -translate-x-[72px] items-center gap-[11px] md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-2 text-sm transition ${isActive(item.href) ? "bg-white text-[var(--foreground)] shadow-[0_4px_14px_rgba(23,19,17,0.08)]" : "text-[var(--secondary)] hover:text-[var(--foreground)]"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <SearchOverlay />
          {readerEmail ? <div className="relative"><button type="button" onClick={() => setAccountOpen((value) => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.65)] px-3 text-sm font-medium text-[var(--foreground)]"><span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[var(--foreground)] text-xs text-white" style={profile?.avatar_url ? { backgroundImage: `url(${profile.avatar_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>{profile?.avatar_url ? null : (profile?.display_name || readerEmail || "F").slice(0, 1).toUpperCase()}</span><span className="max-w-24 truncate">{profile?.display_name || readerEmail}</span></button>{accountOpen ? <div className="absolute right-0 top-12 z-50 min-w-44 rounded-[1rem] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow-soft)]"><Link href="/account" onClick={() => setAccountOpen(false)} className="block rounded-[0.75rem] px-3 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--surface-alt)]">个人中心</Link><button type="button" onClick={handleLogout} className="block w-full rounded-[0.75rem] px-3 py-2.5 text-left text-sm text-[var(--foreground)] hover:bg-[var(--surface-alt)]">退出登录</button></div> : null}</div> : <AuthOverlay />}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <SearchOverlay mobile />
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
      </div>

      {open ? (
        <div className="border-t border-[var(--border)] bg-[rgba(250,246,239,0.95)] md:hidden">
          <nav className="mx-auto flex max-w-[1120px] flex-col gap-2 px-4 py-4 sm:px-6">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-2xl px-4 py-3 text-sm ${isActive(item.href) ? "bg-white font-semibold text-[var(--foreground)]" : "text-[var(--foreground)] hover:bg-[var(--surface-alt)]"}`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/search"
              onClick={() => setOpen(false)}
              className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.65)] px-4 py-3 text-sm font-medium text-[var(--foreground)]"
            >
              搜索全站
            </Link>
            {readerEmail ? <><Link href="/account" onClick={() => setOpen(false)} className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.65)] px-4 py-3 text-sm font-medium text-[var(--foreground)]">个人中心</Link><button type="button" onClick={handleLogout} className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.65)] px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">退出登录</button></> : <AuthOverlay mobile />}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
