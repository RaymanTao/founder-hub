import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleActions } from "@/components/articles/article-actions";
import { FavoriteButton } from "@/components/articles/favorite-button";
import { siteInfo } from "@/data/site";
import { requireAdmin } from "@/lib/admin-auth";
import { renderMarkdown } from "@/lib/markdown";
import { getArticleBySlug } from "@/lib/writing";

type Props = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: "预览文章 | Founder Hub",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function AdminArticlePreviewPage({ params }: Props) {
  await requireAdmin();

  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-[920px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.76)] p-5 shadow-[var(--shadow-soft)] sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
            Preview
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--secondary)]">
            {article.published ? "这篇文章已发布。" : "这是后台草稿预览，前台列表不会显示未发布文章。"}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 sm:mt-0">
          <Link
            href={`/admin/articles/${article.slug}`}
            className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
          >
            返回编辑
          </Link>
          {article.published ? (
            <Link
              href={`/writing/${article.slug}`}
              className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-5 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
            >
              查看前台
            </Link>
          ) : null}
        </div>
      </div>

      <article>
        <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[var(--shadow-soft)] sm:p-9">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl">
            {article.title}
          </h1>
          <div className="prose-content">
          {renderMarkdown(article.content, { title: article.title })}
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[rgba(138,106,82,0.14)] bg-[rgba(255,255,255,0.56)] px-3 py-1 text-xs text-[var(--secondary)]"
              >
                #{tag}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ArticleActions
              url={`${siteInfo.url}/writing/${article.slug}`}
              sourceUrl={article.sourceUrl}
            />
            <FavoriteButton slug={article.slug} />
          </div>
        </div>
      </article>
    </main>
  );
}
