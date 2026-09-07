import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleActions } from "@/components/articles/article-actions";
import { FavoriteButton } from "@/components/articles/favorite-button";
import { ReadingProgress } from "@/components/articles/reading-progress";
import { Section } from "@/components/ui/section";
import { siteInfo } from "@/data/site";
import { zhCN } from "@/locale/zh-cn";
import { renderMarkdown } from "@/lib/markdown";
import { createMetadata } from "@/lib/seo";
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
  const relatedCandidates = allArticles
    .filter((item) => item.slug !== article.slug)
    .map((item) => ({
      article: item,
      score:
        (item.category === article.category ? 2 : 0) +
        item.tags.filter((tag) => article.tags.includes(tag)).length
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  const relatedArticles = (
    await Promise.all(
      relatedCandidates.map(async (item) => {
        const detail = await getArticleBySlug(item.article.slug);
        return detail && detail.published && !detail.archived
          ? { article: detail, score: item.score }
          : null;
      })
    )
  )
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .slice(0, 3)
    .map((item) => item.article);

  return (
    <>
      <ReadingProgress />
      <Section>
        <article className="mx-auto max-w-[820px]">
        <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[var(--shadow-soft)] sm:p-9">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl">
            {article.title}
          </h1>
          <div className="prose-content">
          {renderMarkdown(article.content, { title: article.title })}
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Link
                key={tag}
                href={`/?tag=${encodeURIComponent(tag)}#latest`}
                className="rounded-full border border-[rgba(138,106,82,0.14)] bg-[rgba(255,255,255,0.56)] px-3 py-1 text-xs text-[var(--secondary)] transition hover:text-[var(--foreground)]"
              >
                #{tag}
              </Link>
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

        {relatedArticles.length ? (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              相关内容
            </h2>
            <div className="mt-5 grid gap-4">
              {relatedArticles.map((item) => (
                <Link
                  key={item.slug}
                  href={`/writing/${encodeURIComponent(item.slug)}`}
                  className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.68)] p-5 transition hover:border-[rgba(138,106,82,0.32)]"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {item.category} / {item.access === "Free" ? "免费" : "深度"}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-7 text-[var(--secondary)]">
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
