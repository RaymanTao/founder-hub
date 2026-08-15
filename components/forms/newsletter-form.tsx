"use client";

import { FormEvent, useState, useTransition } from "react";
import { zhCN } from "@/locale/zh-cn";

export function NewsletterForm({
  source,
  compact = false
}: {
  source: string;
  compact?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, source })
      });

      const result = (await response.json()) as { message: string };
      setMessage(result.message);

      if (response.ok) {
        setEmail("");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className={compact ? "flex flex-col gap-3" : "flex flex-col gap-3 sm:flex-row"}>
        <label className="sr-only" htmlFor={`newsletter-${source}`}>
          {zhCN.newsletter.label}
        </label>
        <input
          id={`newsletter-${source}`}
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={zhCN.newsletter.placeholder}
          className="min-h-11 flex-1 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 outline-none transition focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:text-white"
        >
          {pending ? zhCN.newsletter.pending : zhCN.newsletter.submit}
        </button>
      </div>
      {message ? (
        <p className="text-sm text-[var(--secondary)]" aria-live="polite">
          {message}
        </p>
      ) : null}
    </form>
  );
}
