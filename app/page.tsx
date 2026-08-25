import Link from "next/link";
import { ArticleCard } from "@/components/cards/article-card";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { ButtonLink } from "@/components/ui/button-link";
import { Section } from "@/components/ui/section";
import { products } from "@/data/products";
import { getPublicResources } from "@/lib/resources";
import { createMetadata } from "@/lib/seo";
import { getAllArticles } from "@/lib/writing";

export const metadata = createMetadata({
  title: "首页",
  description: "Founder Hub 聚合创业、一人公司、融资和案例资讯，面向 AI 创业者提供可信内容和资源。"
});

const topicTabs = ["创业", "一人公司", "融资", "案例", "AI 产品", "增长"] as const;

function getTopicArticles(articles: Awaited<ReturnType<typeof getAllArticles>>, keyword: string) {
  return articles
    .filter((article) =>
      [article.title, article.description, article.category, article.type, ...article.tags]
        .join(" ")
        .toLowerCase()
        .includes(keyword.toLowerCase())
    )
    .slice(0, 4);
}

export default async function HomePage() {
  const [articles, resources] = await Promise.all([
    getAllArticles(),
    getPublicResources()
  ]);
  const featuredArticle = articles.find((item) => item.featured) ?? articles[0];
  const latestArticles = articles
    .filter((item) => item.slug !== featuredArticle?.slug)
    .slice(0, 8);
  const featuredResources = resources.filter((item) => item.featured).slice(0, 2);
  const featuredProducts = products.filter((item) => item.featured).slice(0, 3);
  const fundingArticles = getTopicArticles(articles, "融资");
  const caseArticles = getTopicArticles(articles, "案例");
  const solopreneurArticles = getTopicArticles(articles, "一人公司");

  return (
    <>
      <Section className="pb-8 pt-12 sm:pb-10 sm:pt-16">
        <div className="border-b border-[var(--border)] pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            Founder Intelligence
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-[var(--foreground)] sm:text-6xl">
                给 AI 创业者看的创业、融资与案例资讯
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--secondary)]">
                聚合创业公司、一人公司、融资动态、产品案例和 AI 工具资讯，再沉淀成可执行的分析、资源和方法论。
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] p-5">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                订阅每周创业情报
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--secondary)]">
                收到值得跟进的融资、案例、AI 产品和一人公司方法。
              </p>
              <div className="mt-4">
                <NewsletterForm source="home-intelligence" compact />
              </div>
            </div>
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            {topicTabs.map((topic) => (
              <Link
                key={topic}
                href={`/writing?q=${encodeURIComponent(topic)}`}
                className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.58)] px-3 py-1.5 text-xs font-medium text-[var(--secondary)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
              >
                {topic}
              </Link>
            ))}
          </div>
        </div>
      </Section>

      <Section className="py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          {featuredArticle ? (
            <Link
              href={`/writing/${featuredArticle.slug}`}
              className="block rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[rgba(138,106,82,0.32)] sm:p-8"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                <span>今日精选</span>
                <span>/</span>
                <span>{featuredArticle.category}</span>
                <span>/</span>
                <span>{featuredArticle.source}</span>
              </div>
              <h2 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl">
                {featuredArticle.title}
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--secondary)]">
                {featuredArticle.description}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-2">
                {featuredArticle.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[rgba(138,106,82,0.14)] bg-[rgba(255,255,255,0.56)] px-3 py-1 text-xs text-[var(--secondary)]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </Link>
          ) : null}

          <aside className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                最新情报
              </h2>
              <Link
                href="/writing"
                className="text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
              >
                全部
              </Link>
            </div>
            <div className="mt-5 grid gap-4">
              {latestArticles.slice(0, 5).map((article) => (
                <Link
                  key={article.slug}
                  href={`/writing/${article.slug}`}
                  className="border-b border-[var(--border)] pb-4 last:border-b-0 last:pb-0"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {article.category} / {article.source}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold leading-6 text-[var(--foreground)]">
                    {article.title}
                  </h3>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </Section>

      <Section className="py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {[
            ["融资动态", fundingArticles],
            ["案例拆解", caseArticles.length ? caseArticles : latestArticles.slice(0, 4)],
            ["一人公司", solopreneurArticles.length ? solopreneurArticles : latestArticles.slice(0, 4)]
          ].map(([title, items]) => (
            <div
              key={String(title)}
              className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                  {String(title)}
                </h2>
                <Link
                  href={`/writing?q=${encodeURIComponent(String(title).replace("动态", "").replace("拆解", ""))}`}
                  className="text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
                >
                  更多
                </Link>
              </div>
              <div className="mt-5 grid gap-4">
                {(items as typeof latestArticles).map((article) => (
                  <Link
                    key={article.slug}
                    href={`/writing/${article.slug}`}
                    className="grid gap-2 border-b border-[var(--border)] pb-4 last:border-b-0 last:pb-0"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                      {article.source} / {article.type}
                    </p>
                    <h3 className="text-base font-semibold leading-7 text-[var(--foreground)]">
                      {article.title}
                    </h3>
                    <p className="text-sm leading-6 text-[var(--secondary)]">
                      {article.description}
                    </p>
                  </Link>
                ))}
                {!(items as typeof latestArticles).length ? (
                  <p className="text-sm text-[var(--secondary)]">
                    RSS 聚合开启后，这里会自动出现相关资讯。
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="py-10 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              Resources
            </p>
            <h2 className="mt-3 max-w-lg text-3xl font-semibold tracking-tight text-[var(--foreground)]">
              把文章里的方法沉淀成可复用资源
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--secondary)]">
              工具清单、Brief 模板和工作流会逐步从文章中抽离出来，方便你在自己的项目里直接复用。
            </p>
            <div className="mt-6">
              <ButtonLink href="/resources" variant="secondary">
                浏览资源
              </ButtonLink>
            </div>
          </div>

          <div className="grid gap-4">
            {featuredResources.map((resource) => (
              <Link
                key={resource.id}
                href={resource.href}
                className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] p-5 transition hover:border-[rgba(138,106,82,0.32)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  {resource.category} / {resource.status}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                  {resource.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--secondary)]">
                  {resource.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      <Section className="py-10 sm:py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              Analysis
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
              最新分析
            </h2>
          </div>
          <ButtonLink href="/writing" variant="ghost">
            查看全部
          </ButtonLink>
        </div>
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {latestArticles.slice(0, 6).map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </Section>

      <Section className="pt-8 sm:pt-10">
        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[rgba(255,252,247,0.76)] p-7 shadow-[var(--shadow-soft)] backdrop-blur-[8px] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
            Products & Services
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-4xl">
            从内容库出发，继续沉淀产品、工具和轻量服务。
          </h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                href={product.url}
                className="rounded-[1rem] border border-[rgba(138,106,82,0.14)] bg-[rgba(255,255,255,0.5)] p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  {product.category}
                </p>
                <h3 className="mt-2 font-semibold text-[var(--foreground)]">{product.name}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--secondary)]">
                  {product.tagline}
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/contact">发起合作咨询</ButtonLink>
            <ButtonLink href="/services" variant="secondary">
              查看服务
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
