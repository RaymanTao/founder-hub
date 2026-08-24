import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleActions } from "@/components/articles/article-actions";
import { FavoriteButton } from "@/components/articles/favorite-button";
import { ReadingProgress } from "@/components/articles/reading-progress";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { Section } from "@/components/ui/section";
import { siteInfo } from "@/data/site";
import { zhCN } from "@/locale/zh-cn";
import { renderMarkdown } from "@/lib/markdown";
import { createMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { getAllArticles, getArticleBySlug } from "@/lib/writing";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return createMetadata({
      title: zhCN.articleDetail.notFoundTitle,
      description: zhCN.articleDetail.notFoundDescription
    });
  }

  return createMetadata({
    title: article.title,
    description: article.description,
    path: `/writing/${article.slug}`
  });
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article || !article.published || article.archived) {
    notFound();
  }

  const allArticles = await getAllArticles();
  const relatedArticles = allArticles
    .filter((item) => item.slug !== article.slug)
    .map((item) => ({
      article: item,
      score:
        (item.category === article.category ? 2 : 0) +
        item.tags.filter((tag) => article.tags.includes(tag)).length
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.article);

  return (
    <>
      <ReadingProgress />
      <Section>
        <article className="mx-auto max-w-[820px]">
        <div className="text-sm text-[var(--muted)]">
          <Link href="/writing" className="transition hover:text-[var(--foreground)]">
            文章
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/writing?category=${article.category}`}
            className="transition hover:text-[var(--foreground)]"
          >
            {article.category}
          </Link>
          <span className="mx-2">/</span>
          <span>№ {String(article.number).padStart(3, "0")}</span>
        </div>

        <header className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[var(--shadow-soft)] sm:p-9">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            <span>{article.type}</span>
            <span>/</span>
            <span>{article.access === "Free" ? "免费开放" : "深度文章"}</span>
            {article.verified ? (
              <>
                <span>/</span>
                <span>已核对</span>
              </>
            ) : null}
          </div>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl">
            {article.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-[var(--secondary)]">
            {article.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Link
                key={tag}
                href={`/writing?tag=${encodeURIComponent(tag)}`}
                className="rounded-full border border-[rgba(138,106,82,0.14)] bg-[rgba(255,255,255,0.56)] px-3 py-1 text-xs text-[var(--secondary)] transition hover:text-[var(--foreground)]"
              >
                #{tag}
              </Link>
            ))}
          </div>
          <ArticleActions
            title={article.title}
            url={`${siteInfo.url}/writing/${article.slug}`}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <FavoriteButton slug={article.slug} />
          </div>
        </header>

        <div className="mt-5 rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] p-4 text-sm text-[var(--secondary)] sm:flex sm:items-center sm:justify-between sm:gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[var(--foreground)]">
              {article.verified ? "已核对" : "待核对"}
            </span>
            <span>/</span>
            <span>来源：</span>
            {article.sourceUrl ? (
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[var(--accent)] hover:text-[var(--accent-strong)]"
              >
                {article.source}
              </a>
            ) : (
              <span>{article.source}</span>
            )}
          </div>
          <div className="mt-2 text-[var(--muted)] sm:mt-0">
            {formatDate(article.date)} / {article.readingTime}
          </div>
        </div>

        <div className="prose-content mt-8 rounded-[1.5rem] border border-[var(--border)] bg-white p-7 shadow-[var(--shadow-soft)] sm:p-10">
          {renderMarkdown(article.content)}
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-[rgba(255,252,247,0.76)] p-6 shadow-[var(--shadow-soft)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
            Newsletter
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            获取下一篇文章和资源更新
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--secondary)]">
            我会把 AI 产品、自动化、增长和一人公司相关的新文章与资源整理后发给你。
          </p>
          <div className="mt-5 max-w-md">
            <NewsletterForm source={`article:${article.slug}`} compact />
          </div>
        </div>

        {relatedArticles.length ? (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              相关内容
            </h2>
            <div className="mt-5 grid gap-4">
              {relatedArticles.map((item) => (
                <Link
                  key={item.slug}
                  href={`/writing/${item.slug}`}
                  className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.68)] p-5 transition hover:border-[rgba(138,106,82,0.32)]"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {item.category} / {item.access === "Free" ? "免费" : "深度"}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--secondary)]">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        </article>
      </Section>
    </>
  );
}
