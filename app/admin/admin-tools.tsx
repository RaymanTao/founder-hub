"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type SearchResult = {
  kind: string;
  title: string;
  description: string;
  href: string;
  meta: string;
};

function Icon({ name }: { name: "search" | "sun" | "moon" | "logout" }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" /></>,
    moon: <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z" />,
    logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M14 3h5v18h-5" /></>
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function AdminSearchButton() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open || !query.trim()) return;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(query.trim())}`, { cache: "no-store" });
        if (response.ok) setResults((await response.json()).results ?? []);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [open, query]);

  return (
    <>
      <button type="button" title="搜索后台内容" aria-label="搜索后台内容" className="admin-tool-button" onClick={() => setOpen(true)}>
        <Icon name="search" />
      </button>
      {open ? (
        <div className="admin-search-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section className="admin-search-panel" role="dialog" aria-modal="true" aria-label="搜索后台内容">
            <div className="admin-search-heading">
              <div><p className="admin-topbar-eyebrow">Workspace Search</p><h2>搜索后台内容</h2></div>
              <button type="button" title="关闭搜索" aria-label="关闭搜索" className="admin-search-close" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="admin-search-input-wrap">
              <Icon name="search" />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文章、资源、RSS 来源和候选内容..." />
            </div>
            {loading ? <p className="admin-search-hint">搜索中...</p> : null}
            {!loading && query.trim() && !results.length ? <p className="admin-search-hint">没有找到匹配内容。</p> : null}
            <div className="admin-search-results">
              {query.trim() ? results.map((result) => (
                <Link key={`${result.kind}-${result.href}-${result.title}`} href={result.href} onClick={() => setOpen(false)} className="admin-search-result">
                  <span className="admin-search-result-kind">{result.kind}</span>
                  <span className="admin-search-result-body"><strong>{result.title}</strong><small>{result.description || result.meta}</small></span>
                  <span className="admin-search-arrow">→</span>
                </Link>
              )) : null}
            </div>
            <p className="admin-search-footer">输入关键词搜索 · Esc 关闭</p>
          </section>
        </div>
      ) : null}
    </>
  );
}

export function AdminThemeButtons() {
  const [dark, setDark] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setDark(window.localStorage.getItem("founder-hub-admin-theme") === "dark");
      initialized.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    document.documentElement.classList.toggle("admin-dark", dark);
    window.localStorage.setItem("founder-hub-admin-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="admin-theme-buttons" aria-label="页面主题">
      <button type="button" title="浅色模式" aria-label="切换浅色模式" className={`admin-tool-button${!dark ? " is-selected" : ""}`} onClick={() => setDark(false)}><Icon name="sun" /></button>
      <button type="button" title="深色模式" aria-label="切换深色模式" className={`admin-tool-button${dark ? " is-selected" : ""}`} onClick={() => setDark(true)}><Icon name="moon" /></button>
    </div>
  );
}
