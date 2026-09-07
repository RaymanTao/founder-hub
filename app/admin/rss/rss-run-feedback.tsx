"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RssRunFeedback({
  status,
  items,
  reason,
  title,
  message
}: {
  status?: string;
  items?: string;
  reason?: string;
  title?: string;
  message?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(Boolean(status));
  if (!status || !open) return null;

  const success = status === "success";
  function close() {
    setOpen(false);
    const url = new URL(window.location.href);
    ["run", "items", "reason", "deleted"].forEach((key) => url.searchParams.delete(key));
    router.replace(`${url.pathname}${url.search}${url.hash}`);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4" role="presentation">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="rss-run-feedback-title"
        className="w-full max-w-md rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl"
      >
        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-xl ${success ? "bg-[rgba(74,106,84,0.12)] text-[var(--success)]" : "bg-[rgba(143,78,69,0.12)] text-[var(--danger)]"}`}>
          {success ? "✓" : "!"}
        </div>
        <h2 id="rss-run-feedback-title" className="mt-4 text-center text-lg font-semibold text-[var(--foreground)]">
          {title ?? (success ? "抓取完成" : "抓取失败")}
        </h2>
        <p className="mt-2 text-center text-sm leading-6 text-[var(--secondary)]">
          {message ?? (success ? `本次新增 ${items ?? 0} 篇文章。` : reason || "抓取失败，请稍后重试。")}
        </p>
        <button
          type="button"
          onClick={close}
          autoFocus
          className="mt-5 min-h-11 w-full rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
        >
          知道了
        </button>
      </section>
    </div>
  );
}
