"use client";

import { useState } from "react";

export function ArticleActions({
  title,
  url
}: {
  title: string;
  url: string;
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

  const share = async () => {
    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({ title, url });
      setMessage("分享面板已打开");
    } catch {
      setMessage(null);
    }
  };

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={copyLink}
        className="min-h-10 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-4 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
      >
        复制链接
      </button>
      <button
        type="button"
        onClick={share}
        className="min-h-10 rounded-full bg-[var(--foreground)] px-4 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
      >
        分享文章
      </button>
      {message ? (
        <span className="text-sm text-[var(--muted)]" aria-live="polite">
          {message}
        </span>
      ) : null}
    </div>
  );
}
