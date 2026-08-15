import Link from "next/link";
import { Card } from "@/components/ui/card";
import { zhCN } from "@/locale/zh-cn";
import { formatDate } from "@/lib/utils";
import type { ArticleMeta } from "@/types/article";

export function ArticleCard({ article }: { article: ArticleMeta }) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
        <span>{article.category}</span>
        <span>/</span>
        <span>{article.type}</span>
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-tight text-[var(--foreground)]">
        {article.title}
      </h3>
      <p className="mt-4 flex-1 text-sm leading-7 text-[var(--secondary)]">
        {article.description}
      </p>
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
