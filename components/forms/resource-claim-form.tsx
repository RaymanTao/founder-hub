"use client";

import { FormEvent, useState, useTransition } from "react";

export function ResourceClaimForm({
  resourceId,
  source = "resources"
}: {
  resourceId: string;
  source?: string;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [href, setHref] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch("/api/resources/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          resourceId,
          source
        })
      });

      const result = (await response.json()) as {
        message: string;
        href?: string;
      };

      setMessage(result.message);

      if (response.ok) {
        setHref(result.href ?? null);
        setEmail("");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor={`resource-${resourceId}`}>
          邮箱地址
        </label>
        <input
          id={`resource-${resourceId}`}
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="输入邮箱领取"
          className="min-h-11 flex-1 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "领取中..." : "领取资源"}
        </button>
      </div>
      {message ? (
        <p className="text-sm text-[var(--secondary)]" aria-live="polite">
          {message}
          {href ? (
            <>
              {" "}
              <a
                href={href}
                className="font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
              >
                打开资源
              </a>
            </>
          ) : null}
        </p>
      ) : null}
    </form>
  );
}
