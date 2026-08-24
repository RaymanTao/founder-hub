"use client";

import { FormEvent, useState, useTransition } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch("/api/auth/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });
      const result = (await response.json()) as {
        message: string;
        devLink?: string;
      };

      setMessage(result.message);
      setDevLink(result.devLink ?? null);

      if (response.ok && !result.devLink) {
        setEmail("");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <label className="block text-sm font-medium text-[var(--foreground)]">
        邮箱地址
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 min-h-11 w-full rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.78)] px-4 outline-none transition focus:border-[var(--accent)]"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 w-full rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "发送中..." : "发送登录链接"}
      </button>
      {message ? (
        <p className="text-sm leading-6 text-[var(--secondary)]" aria-live="polite">
          {message}
        </p>
      ) : null}
      {devLink ? (
        <a
          href={devLink}
          className="block break-all rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.56)] p-3 text-sm font-medium text-[var(--accent)]"
        >
          开发模式登录链接：{devLink}
        </a>
      ) : null}
    </form>
  );
}
