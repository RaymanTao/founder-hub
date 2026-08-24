"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function FavoriteButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    fetch(`/api/favorites/status?slug=${encodeURIComponent(slug)}`)
      .then((response) => response.json())
      .then((data: { authenticated: boolean; favorited: boolean }) => {
        setAuthenticated(data.authenticated);
        setFavorited(data.favorited);
      })
      .catch(() => {
        setAuthenticated(false);
        setFavorited(false);
      });
  }, [slug]);

  const toggle = () => {
    if (!authenticated) {
      router.push("/login");
      return;
    }

    startTransition(async () => {
      const nextFavorited = !favorited;
      const response = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          slug,
          favorited: nextFavorited
        })
      });
      const result = (await response.json()) as {
        favorited?: boolean;
        message: string;
      };

      setMessage(result.message);

      if (response.ok && typeof result.favorited === "boolean") {
        setFavorited(result.favorited);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className="min-h-10 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-4 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {favorited ? "已收藏" : "收藏文章"}
      </button>
      {message ? (
        <span className="text-sm text-[var(--muted)]" aria-live="polite">
          {message}
        </span>
      ) : null}
    </>
  );
}
