"use client";

import { useState } from "react";

export function ArticleActions({
  url,
  sourceUrl
}: {
  url: string;
  sourceUrl?: string;
}) {
  const [message, setMessage] = useState<string | null>(null);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("链接已复制");
    } catch {
      setMessage("复制失败，可以手动复制地址栏链接");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={copyLink}
        className="min-h-10 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-4 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
      >
        复制链接
      </button>
      {sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center rounded-full bg-[var(--foreground)] px-4 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
        >
          查看原文
        </a>
      ) : null}
      {message ? (
        <span className="text-sm text-[var(--muted)]" aria-live="polite">
          {message}
        </span>
      ) : null}
    </div>
  );
}
