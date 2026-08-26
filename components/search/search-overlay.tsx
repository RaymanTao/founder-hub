"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { ArticleMeta } from "@/types/article";

function SearchIcon() {
  return <span aria-hidden="true" className="relative block h-4 w-4"><span className="absolute left-0 top-0 h-3 w-3 rounded-full border-[1.5px] border-current" /><span className="absolute bottom-0 right-0 h-2 w-[1.5px] rotate-[-45deg] bg-current" /></span>;
}

export function SearchOverlay({ mobile = false }: { mobile?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArticleMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = query.trim();
    if (!normalized) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(normalized)}`);
      if (!response.ok) throw new Error("search-failed");
      const payload = (await response.json()) as { results?: ArticleMeta[] };
      setResults(payload.results ?? []);
    } catch {
      setError("搜索暂时不可用，请稍后再试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="搜索全站"
        onClick={() => setOpen(true)}
        className={mobile ? "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.6)] md:hidden" : "inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.6)] text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"}
      >
        <SearchIcon />
      </button>

      {open && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 z-[70] flex min-h-screen items-center justify-center overflow-y-auto bg-black/45 px-4 py-8 backdrop-blur-[3px] sm:py-12" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-label="全站搜索" className="w-full max-w-3xl rounded-[1.25rem] border border-white/20 bg-[#F3ECE2] p-5 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Search</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">搜索全站内容</h2></div>
              <button type="button" aria-label="关闭搜索" onClick={() => setOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-xl text-[var(--secondary)]">×</button>
            </div>
            <form onSubmit={handleSubmit} className="mt-7 flex gap-3">
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文章、标签、来源或正文..." className="min-h-12 min-w-0 flex-1 rounded-full border border-[var(--border)] bg-white/75 px-5 text-sm outline-none transition focus:border-[var(--accent)]" />
              <button type="submit" disabled={loading} className="min-h-12 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent)] disabled:cursor-wait disabled:opacity-60">{loading ? "搜索中" : "搜索"}</button>
            </form>
            {query.trim() ? <p className="mt-5 text-sm text-[var(--muted)]">“{query.trim()}”找到 {results.length} 篇内容</p> : <p className="mt-5 text-sm text-[var(--secondary)]">输入关键词，搜索文章标题、摘要、正文、标签和来源。</p>}
            {error ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
            {results.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2">{results.map((article) => <Link key={article.slug} href={`/writing/${article.slug}`} onClick={() => setOpen(false)} className="rounded-xl border border-[var(--border)] bg-white/65 p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent)]"><p className="text-xs text-[var(--muted)]">{article.category} · {formatDate(article.date)}</p><h3 className="mt-2 font-semibold leading-6 text-[var(--foreground)]">{article.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--secondary)]">{article.description}</p><p className="mt-3 text-xs font-medium text-[var(--accent)]">阅读文章 →</p></Link>)}</div> : null}
            {query.trim() && !loading && !error && !results.length ? <div className="mt-6 rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--secondary)]">没有找到匹配内容，换个关键词再试试。</div> : null}
            <div className="mt-7 flex items-center justify-between text-xs text-[var(--muted)]"><span>按 Esc 关闭</span><Link href="/search" onClick={() => setOpen(false)} className="text-[var(--accent)]">打开完整搜索页 →</Link></div>
          </section>
        </div>,
        document.body
      ) : null}
    </>
  );
}
