import Link from "next/link";
import { Card } from "@/components/ui/card";
import { zhCN } from "@/locale/zh-cn";
import { formatDate } from "@/lib/utils";
import type { ArticleMeta } from "@/types/article";

export function ArticleCard({ article }: { article: ArticleMeta }) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        <span>№ {String(article.number).padStart(3, "0")}</span>
        <span>/</span>
        <span>{article.category}</span>
        <span>/</span>
        <span>{article.access === "Free" ? "免费" : "深度"}</span>
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-tight text-[var(--foreground)]">
        {article.title}
      </h3>
      <p className="mt-4 flex-1 text-sm leading-7 text-[var(--secondary)]">
        {article.description}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {article.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-[rgba(138,106,82,0.14)] bg-[rgba(255,255,255,0.56)] px-2.5 py-1 text-[11px] text-[var(--secondary)]"
          >
            #{tag}
          </span>
        ))}
      </div>
      <div className="mt-5 border-t border-[var(--border)] pt-4 text-xs leading-6 text-[var(--muted)]">
        {article.verified ? "已核对" : "待核对"} / 来源：{article.source}
      </div>
      <div className="mt-6 flex items-center justify-between gap-4 text-sm">
        <div className="text-[var(--muted)]">
          {formatDate(article.date)} / {article.readingTime}
        </div>
        <Link
          href={`/writing/${article.slug}`}
          className="font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
        >
          {zhCN.writing.read}
        </Link>
      </div>
    </Card>
  );
}
