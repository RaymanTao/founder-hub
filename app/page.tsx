import Link from "next/link";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { Section } from "@/components/ui/section";
import { createMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { getAllArticles } from "@/lib/writing";
import type { ArticleMeta } from "@/types/article";

export const metadata = createMetadata({
  title: "首页",
  description: "Founder Hub 聚合创业、一人公司、融资和案例资讯，面向 AI 创业者提供可信内容和资源。"
});

const topics = ["全部", "创业", "公司", "融资", "案例", "AI", "增长"];

function ArticleMetaLine({ article }: { article: ArticleMeta }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
      <span>{formatDate(article.date)}</span>
      <span>/</span>
      <span>{article.category}</span>
      <span>/</span>
      <span>{article.source}</span>
    </div>
  );
}

function CompactArticleRow({ article }: { article: ArticleMeta }) {
  return (
    <Link
      href={`/writing/${article.slug}`}
      className="grid gap-2 border-b border-[var(--border)] py-5 transition last:border-b-0 hover:text-[var(--accent-strong)]"
    >
      <ArticleMetaLine article={article} />
      <h3 className="text-xl font-semibold leading-8 tracking-tight text-[var(--foreground)]">
        {article.title}
      </h3>
      <p className="text-sm leading-7 text-[var(--secondary)]">{article.description}</p>
    </Link>
  );
}

export default async function HomePage() {
  const articles = await getAllArticles();
  const featuredArticle = articles.find((item) => item.featured) ?? articles[0];
  const latestArticles = articles
    .filter((item) => item.slug !== featuredArticle?.slug)
    .slice(0, 7);

  return (
    <>
      <Section className="pb-7 pt-14 sm:pb-8 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            Founder Hub
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-7xl">
            创业情报，讲到你懂
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[var(--secondary)]">
            聚合创业公司、一人公司、融资、案例和 AI 产品资讯，筛掉噪音，只留下创始人值得跟进的线索。
          </p>
        </div>

        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2">
          {topics.map((topic) => (
            <Link
              key={topic}
              href={topic === "全部" ? "/writing" : `/writing?q=${encodeURIComponent(topic)}`}
              className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.64)] px-4 py-2 text-sm font-medium text-[var(--secondary)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
            >
              {topic}
            </Link>
          ))}
        </div>
      </Section>

      <Section className="py-7 sm:py-8">
        <div className="grid gap-10 border-y border-[var(--border)] py-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                今日精选
              </h2>
              <Link
                href="/writing"
                className="text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
              >
                查看全部
              </Link>
            </div>

            {featuredArticle ? (
              <Link
                href={`/writing/${featuredArticle.slug}`}
                className="mt-6 block transition hover:text-[var(--accent-strong)]"
              >
                <ArticleMetaLine article={featuredArticle} />
                <h3 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl">
                  {featuredArticle.title}
                </h3>
                <p className="mt-5 text-base leading-8 text-[var(--secondary)]">
                  {featuredArticle.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {featuredArticle.tags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[rgba(138,106,82,0.14)] bg-[rgba(255,255,255,0.56)] px-3 py-1 text-xs text-[var(--secondary)]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </Link>
            ) : (
              <p className="mt-6 text-sm text-[var(--secondary)]">
                暂时还没有内容。RSS 聚合开启后，这里会显示今日精选。
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                最新解读
              </h2>
              <Link
                href="/writing"
                className="text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
              >
                内容库
              </Link>
            </div>
            <div className="mt-3">
              {latestArticles.map((article) => (
                <CompactArticleRow key={article.slug} article={article} />
              ))}
              {!latestArticles.length ? (
                <p className="py-5 text-sm text-[var(--secondary)]">
                  暂时还没有最新解读。
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </Section>

      <Section className="pb-16 pt-8 sm:pb-20">
        <div className="mx-auto max-w-2xl border-t border-[var(--border)] pt-8 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            订阅创业情报
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--secondary)]">
            每周整理值得关注的融资、案例、产品和一人公司方法，发给真正需要做判断的人。
          </p>
          <div className="mx-auto mt-5 max-w-lg">
            <NewsletterForm source="home-intelligence" />
          </div>
        </div>
      </Section>
    </>
  );
}
